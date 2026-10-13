import { HelpChat } from "@/components/help/help-chat"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>
}) {
  await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const articlesResult = await supabase.rpc("search_help_articles", {
    p_query: "help BorrowLah",
    p_limit: 8,
  })
  if (articlesResult.error) throw new Error(articlesResult.error.message)
  const articles = (articlesResult.data ?? []) as Array<{
    id: string
    slug: string
    title: string
    body: string
    category: string
  }>
  const conversationId = params.conversation && /^[0-9a-f-]{36}$/i.test(params.conversation)
    ? params.conversation
    : ""
  const userId = (await supabase.auth.getUser()).data.user?.id ?? ""
  const messagesResult = conversationId
    ? await supabase
        .from("help_messages")
        .select("id,role,content,created_at")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .order("created_at")
    : { data: [], error: null }
  if (messagesResult.error) throw new Error(messagesResult.error.message)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        back={{ href: "/home", label: "Home" }}
        eyebrow="Help"
        title="How can we help?"
        description="Ask about BetterPoints, trust tiers, deposits, handover, requests or bundles. Your question is rate-limited and never exposes another resident's data."
      />
      <div className="mt-7">
        <HelpChat
          initialArticles={articles}
          initialConversationId={conversationId}
          initialMessages={(messagesResult.data ?? []) as Array<{ id: string; role: string; content: string; created_at: string }>}
        />
      </div>
    </div>
  )
}
