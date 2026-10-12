import { HelpChat } from "@/components/help/help-chat"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function HelpPage() {
  await requireActiveMember()
  const supabase = await createClient()
  const articlesResult = await supabase.rpc("search_help_articles", {
    p_query: "help BorrowBetter",
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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        back={{ href: "/home", label: "Home" }}
        eyebrow="Help"
        title="How can we help?"
        description="Ask about BetterPoints, trust tiers, deposits, handover, requests or bundles. Your question is rate-limited and never exposes another resident's data."
      />
      <div className="mt-7">
        <HelpChat initialArticles={articles} />
      </div>
    </div>
  )
}
