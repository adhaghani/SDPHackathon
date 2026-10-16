import Link from "next/link"

import { FeedCard } from "@/components/block/feed-card"
import { IntentComposer } from "@/components/block/intent-composer"
import { SavedItemsSection } from "@/components/borrow/saved-items-section"
import type { SavedItemCardItem } from "@/components/borrow/saved-item-card"
import { Sheet } from "@/components/block/layout"
import { RecyclingImpactSummary } from "@/components/recycling/impact-summary"
import { TurtleGoalCard } from "@/components/recycling/turtle-goal-card"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { malayGreeting } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { parseRecyclingCampaign, parseRecyclingSummary } from "@/lib/recycling"
import { getSavedItemIds } from "@/lib/saved-items"
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format"
import { SectionRetry } from "@/components/home/section-retry"
import { NextSteps } from "@/components/home/next-steps"
import { settleSection } from "@/lib/home"
import { resolveRewardRule } from "@/lib/points"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const now = new Date()
  const savedResult = await settleSection(
    getSavedItemIds(active.user.id).then((data) => ({ data, error: null }))
  )
  const savedItemIds = savedResult.data ?? []

  const [
    itemsResult,
    eventsResult,
    helpResult,
    rulesResult,
    bookingsResult,
    ticketsResult,
    recyclingSummaryResult,
    recyclingCampaignResult,
    recyclingGuideResult,
  ] = await Promise.all([
    settleSection(
      supabase
        .from("items")
        .select("id,title,photo_paths,deposit_rm,max_loan_days,owner_id")
        .eq("township_id", active.townshipId)
        .eq("status", "active")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(3)
    ),
    settleSection(
      supabase
        .from("events")
        .select("id,title,starts_at,location_text,event_categories(slug)")
        .eq("township_id", active.townshipId)
        .eq("status", "published")
        .gte("starts_at", now.toISOString())
        .order("starts_at")
        .limit(3)
    ),
    settleSection(
      supabase
        .from("help_requests")
        .select("id,title,kind,needed_by")
        .eq("township_id", active.townshipId)
        .eq("status", "open")
        .neq("requester_id", active.user.id)
        .order("created_at", { ascending: false })
        .limit(3)
    ),
    settleSection(
      supabase
        .from("reward_rules")
        .select("township_id,action_type,category_slug,points")
        .eq("active", true)
        .or(`township_id.is.null,township_id.eq.${active.townshipId}`)
    ),
    settleSection(
      supabase
        .from("bookings")
        .select(
          "id,status,borrower_id,lender_id,end_date,borrower_handover_confirmed_at,lender_handover_confirmed_at,borrower_return_marked_at,items(title)"
        )
        .eq("township_id", active.townshipId)
        .or(`borrower_id.eq.${active.user.id},lender_id.eq.${active.user.id}`)
        .in("status", ["requested", "approved", "handed_over"])
        .order("end_date")
    ),
    settleSection(
      supabase
        .from("event_rsvps")
        .select("id,event_id,events!inner(title,starts_at,township_id,status)")
        .eq("user_id", active.user.id)
        .eq("status", "going")
        .eq("events.township_id", active.townshipId)
        .eq("events.status", "published")
        .gte("events.starts_at", now.toISOString())
    ),
    settleSection(
      supabase.rpc("resident_recycling_summary", {
        p_township_id: active.townshipId,
        p_user_id: active.user.id,
      })
    ),
    settleSection(
      supabase.rpc("township_recycling_progress", {
        p_township_id: active.townshipId,
      })
    ),
    settleSection(
      supabase
        .from("points_ledger")
        .select("id")
        .eq("user_id", active.user.id)
        .eq("township_id", active.townshipId)
        .eq("action_type", "recycling_guide_completed")
        .limit(1)
        .maybeSingle()
    ),
  ])

  const savedItemsResult = savedItemIds.length
    ? await settleSection(
        supabase
          .from("items")
          .select(
            "id,title,photo_paths,deposit_rm,max_loan_days,kind,duration_minutes,condition,item_categories(name,slug)"
          )
          .eq("township_id", active.townshipId)
          .eq("status", "active")
          .eq("hidden", false)
          .in("id", savedItemIds)
      )
    : { data: [] as SavedItemCardItem[], error: null }

  const savedItemsById = new Map(
    (savedItemsResult.data ?? []).map((item) => [item.id, item])
  )
  const savedItems = savedItemIds
    .map((id) => savedItemsById.get(id))
    .filter((item): item is SavedItemCardItem => Boolean(item))

  const items = itemsResult.data ?? []
  const events = eventsResult.data ?? []
  const helpRequests = helpResult.data ?? []
  const ownerIds = [
    ...new Set(items.map((item) => item.owner_id).filter(Boolean)),
  ]
  const ownerProfiles = ownerIds.length
    ? await settleSection(
        supabase
          .from("public_profiles")
          .select("id,display_name")
          .in("id", ownerIds)
      )
    : { data: [] as Array<{ id: string; display_name: string | null }> }
  const ownerNames = new Map(
    (ownerProfiles.data ?? []).map((profile) => [
      profile.id,
      profile.display_name,
    ])
  )

  const eventCounts = await Promise.all(
    events.map((event) =>
      settleSection(
        supabase
          .from("event_rsvps")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id)
          .in("status", ["going", "checked_in"])
      )
    )
  )

  const firstName = active.profile?.display_name?.split(" ")[0] ?? "neighbour"
  const townshipName = active.membership.townships?.name ?? "Your township"
  const blockName = "Your block"
  const balance = active.points?.balance ?? 0
  const recyclingSummary = parseRecyclingSummary(
    (recyclingSummaryResult.data ?? {}) as Record<string, unknown>
  )
  const recyclingCampaign = parseRecyclingCampaign(
    (recyclingCampaignResult.data ?? {}) as Record<string, unknown>
  )
  const recyclingGuideReward =
    resolveRewardRule(rulesResult.data ?? [], "recycling_guide_completed")
      ?.points ?? 5

  const feed = [
    ...items.slice(0, 1).map((item) => ({
      key: `item-${item.id}`,
      variant: "item" as const,
      href: `/borrow/items/${item.id}`,
      title: item.title,
      meta: `${ownerNames.get(item.owner_id) ?? "A neighbour"} · ${Number(item.deposit_rm) === 0 ? "free to borrow" : `${formatMoney(item.deposit_rm)} deposit`} · up to ${item.max_loan_days} days`,
      image: item.photo_paths?.[0] ?? "/demo/item-placeholder.svg",
    })),
    ...events.slice(0, 1).map((event, index) => {
      const date = new Date(event.starts_at)
      const reward = resolveRewardRule(
        rulesResult.data ?? [],
        "event_attendance",
        event.event_categories?.slug
      )?.points
      return {
        key: `event-${event.id}`,
        variant: "event" as const,
        href: `/events/${event.id}`,
        title: event.title,
        meta: `${formatEventTime(event.starts_at)} · ${eventCounts[index]?.count ?? 0} going${reward == null ? "" : ` · up to ${reward} BP after verified check-in`}`,
        date: {
          day: new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            weekday: "short",
          }).format(date),
          number: new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            day: "numeric",
          }).format(date),
          month: new Intl.DateTimeFormat("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            month: "short",
          }).format(date),
        },
      }
    }),
    ...helpRequests.slice(0, 1).map((request) => ({
      key: `help-${request.id}`,
      variant: "help" as const,
      href: "/community",
      title: request.title,
      meta: `${request.kind.replaceAll("_", " ")} · ${request.needed_by ? formatEventDate(request.needed_by) : "when you can"}`,
    })),
  ]

  return (
    <div className="-mx-4 overflow-hidden rounded-none bg-lime text-ink sm:-mx-6 md:mx-0 md:rounded-[32px]">
      <div className="px-5 pt-5 pb-8 sm:px-7 md:px-10 md:pt-8">
        <header className="flex items-center justify-between gap-3 pr-14 md:pr-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full bg-ink"
            />
            <span className="truncate text-sm font-semibold">
              {blockName} · {townshipName}
            </span>
          </div>
          <BetterPointsChip balance={balance} />
        </header>

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
          <h1 className="text-hero text-balance">
            {malayGreeting(
              new Date(
                now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
              )
            )}
            , {firstName}.<br />
            What&apos;s up today?
          </h1>
          <IntentComposer />
        </section>
      </div>

      <Sheet className="min-h-[420px] rounded-b-none px-5 pt-6 pb-8 sm:px-7 md:px-10 md:pt-8">
        <NextSteps
          userId={active.user.id}
          bookings={bookingsResult.data ?? []}
          tickets={ticketsResult.data ?? []}
          failed={Boolean(bookingsResult.error || ticketsResult.error)}
        />
        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h2 className="text-h2">Near you, right now</h2>
        </div>

        <div className="mt-3.5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {feed.map(({ key, ...entry }) => (
            <FeedCard key={key} {...entry} />
          ))}
        </div>

        {itemsResult.error ? (
          <SectionRetry label="Borrowing suggestions" />
        ) : null}
        {eventsResult.error ? <SectionRetry label="Upcoming events" /> : null}
        {helpResult.error ? <SectionRetry label="Community requests" /> : null}
        {savedResult.error || savedItemsResult.error ? (
          <SectionRetry label="Saved items" />
        ) : (
          <SavedItemsSection items={savedItems} />
        )}
        <p className="mt-4 text-sm text-ink-soft">
          BetterPoints are awarded after the required confirmation, subject to
          the township reward rules and daily or weekly caps. Requesting or
          approving a loan earns no points.
        </p>
        {rulesResult.error ? <SectionRetry label="Reward information" /> : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)] lg:items-start">
          {recyclingSummaryResult.error ? (
            <SectionRetry label="Your recycling impact" />
          ) : (
            <RecyclingImpactSummary
              summary={recyclingSummary}
              guideCompleted={Boolean(recyclingGuideResult.data)}
              guideRewardPoints={recyclingGuideReward}
            />
          )}
          {recyclingCampaignResult.error ? (
            <SectionRetry label="Township recycling goal" />
          ) : (
            <TurtleGoalCard campaign={recyclingCampaign} />
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/borrow"
            className="rounded-[20px] bg-sky p-4 text-sm font-bold text-ink"
          >
            Browse all PINJAM items <span aria-hidden="true">›</span>
          </Link>
          <Link
            href="/events"
            className="rounded-[20px] bg-lime p-4 text-sm font-bold text-ink"
          >
            See what&apos;s happening <span aria-hidden="true">›</span>
          </Link>
          <Link
            href="/giveaway"
            className="rounded-[20px] bg-mustard p-4 text-sm font-bold text-ink"
          >
            Pass something on <span aria-hidden="true">›</span>
          </Link>
          <Link
            href="/community"
            className="rounded-[20px] bg-mint-tint p-4 text-sm font-bold text-ink"
          >
            Lend a hand nearby <span aria-hidden="true">›</span>
          </Link>
        </div>

        <p className="mt-5 text-xs text-ink-soft">
          Listings and events are township data. Walking distances are not
          available yet.
        </p>
      </Sheet>
    </div>
  )
}
