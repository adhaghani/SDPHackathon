import Link from "next/link"

import { GiveawayCard } from "@/components/giveaway/giveaway-card"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export default async function GiveawayPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()

  const [categoriesResult, giveawaysResult] = await Promise.all([
    supabase
      .from("item_categories")
      .select("id,slug,name,kind")
      .eq("kind", "item")
      .order("name"),
    supabase
      .from("giveaways")
      .select(
        "id,title,description,condition,photo_path,handover_location,handover_notes,status,giver_id,taker_id,giver_confirmed_at,taker_confirmed_at,created_at,item_categories(name,slug)"
      )
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60),
  ])

  if (categoriesResult.error) throw new Error(categoriesResult.error.message)
  if (giveawaysResult.error) throw new Error(giveawaysResult.error.message)

  const query = params.q?.trim().toLowerCase() ?? ""
  const filtered = (giveawaysResult.data ?? []).filter((giveaway) => {
    if (params.category && giveaway.item_categories?.slug !== params.category)
      return false
    if (!query) return true
    return `${giveaway.title} ${giveaway.description}`
      .toLowerCase()
      .includes(query)
  })

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        eyebrow="Beri · Giveaway"
        title="Giveaway"
        description="Pass on old or unusable things that are still useful to someone nearby. Every giveaway is free, and both neighbours can earn 3 BP after the handover is confirmed by both sides. The small daily limit helps discourage misuse."
        actions={
          <>
            <Button render={<Link href="/giveaway/mine" />} variant="outline">
              Your giveaways
            </Button>
            <Button
              render={<Link href="/giveaway/new" />}
              variant="cta"
              size="cta"
            >
              List a giveaway
            </Button>
          </>
        }
      />

      <section
        aria-labelledby="giveaway-browse-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="giveaway-browse-heading" className="text-heading text-ink">
              Available nearby
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Things neighbours are ready to pass on, repair, or reuse.
            </p>
          </div>
          <form method="get" className="flex flex-wrap gap-2">
            <label htmlFor="giveaway-q" className="sr-only">
              Search giveaways
            </label>
            <input
              id="giveaway-q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search fans, books, pots…"
              className="min-h-11 w-full rounded-lg border border-ink-muted bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:w-64"
            />
            <label htmlFor="giveaway-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="giveaway-category"
              name="category"
              defaultValue={params.category ?? ""}
              className="min-h-11 rounded-lg border border-ink-muted bg-surface px-3 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <option value="">All categories</option>
              {(categoriesResult.data ?? []).map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((giveaway) => (
              <GiveawayCard
                key={giveaway.id}
                giveaway={giveaway}
                currentUserId={active.user.id}
              />
            ))}
          </div>
        ) : (
          <Empty className="border border-hairline bg-surface">
            <EmptyHeader>
              <EmptyTitle>No giveaways found</EmptyTitle>
              <EmptyDescription>
                Try a different search, or be the first neighbour to pass
                something on.
              </EmptyDescription>
            </EmptyHeader>
            <Button render={<Link href="/giveaway/new" />} variant="cta">
              List a giveaway
            </Button>
          </Empty>
        )}
      </section>
    </div>
  )
}
