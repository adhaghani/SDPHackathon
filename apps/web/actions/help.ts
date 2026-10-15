"use server"

import { generateHelpAnswer, type HelpArticleContext } from "@/lib/ai"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import {
  articleFallbackAnswer,
  type HelpArticle,
  type HelpMessage,
} from "@/lib/help"

export type HelpActionState = {
  status: "idle" | "error" | "success"
  message?: string
  conversationId?: string
  answer?: string
  source?: "ai" | "articles"
  articles?: HelpArticle[]
  messages?: HelpMessage[]
}

const questionSchema = z.object({
  conversationId: z.uuid().optional().or(z.literal("")),
  question: z
    .string()
    .trim()
    .min(1, { error: "Ask a how-to question." })
    .max(1000),
})

export async function askHelp(
  _state: HelpActionState,
  formData: FormData
): Promise<HelpActionState> {
  const parsed = questionSchema.safeParse({
    conversationId: formData.get("conversationId") || "",
    question: formData.get("question"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Ask a short question.",
    }
  }

  await requireActiveMember()
  const supabase = await createClient()
  const [helpResult, statusResult] = await Promise.all([
    supabase.rpc("send_help_message", {
      p_conversation_id: parsed.data.conversationId || undefined,
      p_question: parsed.data.question,
    }),
    supabase.rpc("get_current_user_booking_statuses"),
  ])
  if (helpResult.error) {
    return {
      status: "error",
      message: helpResult.error.message.includes("rate_limited")
        ? "You have reached 20 Help messages this hour. Try again shortly."
        : "Your message could not be sent.",
    }
  }
  if (statusResult.error) throw new Error(statusResult.error.message)

  const payload = helpResult.data as {
    conversation_id?: string
    message_id?: string
    articles?: HelpActionState["articles"]
    messages?: HelpActionState["messages"]
  }
  const articles = payload.articles ?? []
  const statuses = ((statusResult.data ?? []) as Array<{ status?: string }>)
    .map((row) => row.status)
    .filter((status): status is string => Boolean(status))
  const answer = await generateHelpAnswer(
    parsed.data.question,
    articles as HelpArticleContext[],
    statuses,
    (payload.messages ?? []).filter(
      (message) => message.id !== payload.message_id
    )
  )

  const source = answer ? ("ai" as const) : ("articles" as const)
  const reply = (answer || articleFallbackAnswer(articles)).slice(0, 4000)
  let assistantMessage: HelpMessage = {
    role: "assistant",
    content: reply,
    source,
  }
  let warning: string | undefined
  if (payload.message_id) {
    const saved = await supabase.rpc("save_help_answer", {
      p_message_id: payload.message_id,
      p_answer: reply,
      p_source: source,
    })
    if (saved.error) {
      warning =
        "Your answer is shown, but it couldn't be saved. It may be missing after a refresh."
    } else {
      assistantMessage = saved.data as HelpMessage
    }
  }

  return {
    status: "success",
    conversationId: payload.conversation_id,
    answer: assistantMessage.content,
    source,
    message: warning,
    articles,
    messages: [...(payload.messages ?? []), assistantMessage],
  }
}

export async function talkToOrganiser(
  _state: HelpActionState,
  formData: FormData
): Promise<HelpActionState> {
  const conversationId = formData.get("conversationId")
  const subject = formData.get("subject")
  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_conversation_id:
      typeof conversationId === "string" && conversationId
        ? conversationId
        : undefined,
    p_subject: typeof subject === "string" ? subject : "",
  })
  if (error)
    return {
      status: "error",
      message: "The support ticket could not be created.",
    }
  const result = data as { ticket_id?: string }
  return {
    status: "success",
    message: result.ticket_id
      ? "Support ticket created. An organiser will see it in the township office."
      : "Support ticket created.",
  }
}
