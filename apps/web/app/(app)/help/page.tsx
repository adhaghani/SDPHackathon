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
    p_query: "",
    p_limit: 50,
  })
  if (articlesResult.error) throw new Error(articlesResult.error.message)
  const articles = (articlesResult.data ?? []) as Array<{
    id: string
    slug: string
    title: string
    body: string
    category: string
  }>
  const conversationId =
    params.conversation && /^[0-9a-f-]{36}$/i.test(params.conversation)
      ? params.conversation
      : ""
  const userId = (await supabase.auth.getUser()).data.user?.id ?? ""
  const messagesResult = conversationId
    ? await supabase
        .from("help_messages")
        .select("id,role,content,created_at,source")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40)
    : { data: [], error: null }
  if (messagesResult.error) throw new Error(messagesResult.error.message)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        back={{ href: "/home", label: "Home" }}
        title="Help"
        description="Ask about borrowing, sharing, events and BetterPoints."
      />
      <div className="mt-7">
        <HelpChat
          initialArticles={articles}
          initialConversationId={conversationId}
          initialMessages={
            [...(messagesResult.data ?? [])].reverse() as Array<{
              id: string
              role: string
              content: string
              created_at: string
            }>
          }
        />
      </div>
    </div>
  )
}
