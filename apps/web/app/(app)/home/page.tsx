import Link from "next/link"

import { FeedCard } from "@/components/block/feed-card"
import { IntentComposer } from "@/components/block/intent-composer"
import { SavedItemsSection } from "@/components/borrow/saved-items-section"
import type { SavedItemCardItem } from "@/components/borrow/saved-item-card"
import { Sheet } from "@/components/block/layout"
import { RecyclingImpactSummary } from "@/components/recycling/impact-summary"
import { TurtleGoalCard } from "@/components/recycling/turtle-goal-card"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { levelProgress, malayGreeting } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { parseRecyclingCampaign, parseRecyclingSummary } from "@/lib/recycling"
import { getSavedItemIds } from "@/lib/saved-items"
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const now = new Date()
  const savedItemIds = await getSavedItemIds(active.user.id)

  const [
    itemsResult,
    eventsResult,
    helpResult,
    levelsResult,
    recyclingSummaryResult,
    recyclingCampaignResult,
  ] = await Promise.all([
    supabase
      .from("items")
      .select("id,title,photo_paths,deposit_rm,max_loan_days,owner_id")
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("events")
      .select("id,title,starts_at,location_text")
      .eq("township_id", active.townshipId)
      .eq("status", "published")
      .gte("starts_at", now.toISOString())
      .order("starts_at")
      .limit(3),
    supabase
      .from("help_requests")
      .select("id,title,kind,needed_by")
      .eq("township_id", active.townshipId)
      .eq("status", "open")
      .neq("requester_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("levels").select("level,name,min_lifetime_points").order("level"),
    supabase.rpc("resident_recycling_summary", {
      p_township_id: active.townshipId,
      p_user_id: active.user.id,
    }),
    supabase.rpc("township_recycling_progress", { p_township_id: active.townshipId }),
  ])

  if (itemsResult.error) throw new Error(itemsResult.error.message)
  if (eventsResult.error) throw new Error(eventsResult.error.message)
  if (helpResult.error) throw new Error(helpResult.error.message)
  if (levelsResult.error) throw new Error(levelsResult.error.message)
  if (recyclingSummaryResult.error) throw new Error(recyclingSummaryResult.error.message)
  if (recyclingCampaignResult.error) throw new Error(recyclingCampaignResult.error.message)

  const savedItemsResult = savedItemIds.length
    ? await supabase
        .from("items")
        .select(
          "id,title,photo_paths,deposit_rm,max_loan_days,kind,duration_minutes,condition,item_categories(name,slug)"
        )
        .eq("township_id", active.townshipId)
        .eq("status", "active")
        .eq("hidden", false)
        .in("id", savedItemIds)
    : { data: [] as SavedItemCardItem[], error: null }

  if (savedItemsResult.error) throw new Error(savedItemsResult.error.message)

  const savedItemsById = new Map((savedItemsResult.data ?? []).map((item) => [item.id, item]))
  const savedItems = savedItemIds
    .map((id) => savedItemsById.get(id))
    .filter((item): item is SavedItemCardItem => Boolean(item))

  const items = itemsResult.data ?? []
  const events = eventsResult.data ?? []
  const helpRequests = helpResult.data ?? []
  const ownerIds = [...new Set(items.map((item) => item.owner_id).filter(Boolean))]
  const ownerProfiles = ownerIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", ownerIds)
    : { data: [] as Array<{ id: string; display_name: string | null }> }
  const ownerNames = new Map((ownerProfiles.data ?? []).map((profile) => [profile.id, profile.display_name]))

  const eventCounts = await Promise.all(
    events.map((event) =>
      supabase
        .from("event_rsvps")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .in("status", ["going", "checked_in"])
    )
  )

  const firstName = active.profile?.display_name?.split(" ")[0] ?? "neighbour"
  const townshipName = active.membership.townships?.name ?? "Your township"
  const blockName = "Your block"
  const lifetime = active.points?.lifetime_points ?? 0
  const level = levelProgress(lifetime, levelsResult.data ?? [])
  const balance = active.points?.balance ?? 0
  const recyclingSummary = parseRecyclingSummary(
    (recyclingSummaryResult.data ?? {}) as Record<string, unknown>
  )
  const recyclingCampaign = parseRecyclingCampaign(
    (recyclingCampaignResult.data ?? {}) as Record<string, unknown>
  )

  const feed = [
    ...items.slice(0, 1).map((item) => ({
      key: `item-${item.id}`,
      variant: "item" as const,
      href: `/borrow/items/${item.id}`,
      title: item.title,
      meta: `${ownerNames.get(item.owner_id) ?? "A neighbour"} · ${Number(item.deposit_rm) === 0 ? "free to borrow" : `${formatMoney(item.deposit_rm)} deposit`} · up to ${item.max_loan_days} days`,
      image: item.photo_paths?.[0] ?? "/demo/item-placeholder.svg",
      walkingTime: "2 min walk",
    })),
    ...events.slice(0, 1).map((event, index) => {
      const date = new Date(event.starts_at)
      return {
        key: `event-${event.id}`,
        variant: "event" as const,
        href: `/events/${event.id}`,
        title: event.title,
        meta: `${formatEventTime(event.starts_at)} · ${eventCounts[index]?.count ?? 0} going · +30 BP`,
        date: {
          day: new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short" }).format(date),
          number: new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric" }).format(date),
          month: new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", month: "short" }).format(date),
        },
        walkingTime: "5 min walk",
      }
    }),
    ...helpRequests.slice(0, 1).map((request) => ({
      key: `help-${request.id}`,
      variant: "help" as const,
      href: "/community",
      title: request.title,
      meta: `${request.kind.replaceAll("_", " ")} · ${request.needed_by ? formatEventDate(request.needed_by) : "when you can"}`,
      walkingTime: "10 min walk",
    })),
  ]

  return (
    <div className="-mx-4 overflow-hidden rounded-none bg-lime text-ink sm:-mx-6 md:mx-0 md:rounded-[32px]">
      <div className="px-5 pt-5 pb-8 sm:px-7 md:px-10 md:pt-8">
        <header className="flex items-center justify-between gap-3 pr-14 md:pr-0">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-ink" />
            <span className="truncate text-sm font-semibold">{blockName} · {townshipName}</span>
          </div>
          <BetterPointsChip balance={balance} />
        </header>

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
          <h1 className="text-hero text-balance">
            {malayGreeting(new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })))}, {firstName}.<br />
            What&apos;s up today?
          </h1>
          <IntentComposer />
        </section>
      </div>

      <Sheet className="min-h-[420px] rounded-b-none px-5 pt-6 pb-8 sm:px-7 md:px-10 md:pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h2">Near you, right now</h2>
        </div>

        <div className="mt-3.5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {feed.map(({ key, ...entry }) => (
            <FeedCard key={key} {...entry} />
          ))}
        </div>

        <SavedItemsSection items={savedItems} />

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)] lg:items-start">
          <RecyclingImpactSummary summary={recyclingSummary} />
          <TurtleGoalCard campaign={recyclingCampaign} />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/borrow" className="rounded-[20px] bg-sky p-4 text-sm font-bold text-ink">
            Browse all PINJAM items <span aria-hidden="true">›</span>
          </Link>
          <Link href="/events" className="rounded-[20px] bg-lime p-4 text-sm font-bold text-ink">
            See what&apos;s happening <span aria-hidden="true">›</span>
          </Link>
          <Link href="/giveaway" className="rounded-[20px] bg-mustard p-4 text-sm font-bold text-ink">
            Pass something on <span aria-hidden="true">›</span>
          </Link>
          <Link href="/community" className="rounded-[20px] bg-mint-tint p-4 text-sm font-bold text-ink">
            Lend a hand nearby <span aria-hidden="true">›</span>
          </Link>
        </div>

        <p className="mt-5 text-xs text-ink-soft">
          Walking times are estimates until facility coordinates are available. Listings and events are live township data.
        </p>
      </Sheet>
    </div>
  )
}
