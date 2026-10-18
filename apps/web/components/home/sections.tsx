import { cache } from "react"

import { FeedCard } from "@/components/block/feed-card"
import { SavedItemsSection } from "@/components/borrow/saved-items-section"
import { NextSteps } from "@/components/home/next-steps"
import { SectionRetry } from "@/components/home/section-retry"
import { RecyclingImpactSummary } from "@/components/recycling/impact-summary"
import { TurtleGoalCard } from "@/components/recycling/turtle-goal-card"
import { requireActiveMember } from "@/lib/data"
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format"
import { settleSection } from "@/lib/home"
import { resolveRewardRule } from "@/lib/points"
import { parseRecyclingCampaign, parseRecyclingSummary } from "@/lib/recycling"
import { getSavedItemIds } from "@/lib/saved-items"
import { createClient } from "@/lib/supabase/server"

const getHomeRewardRules = cache(async (townshipId: string) => {
  const supabase = await createClient()
  return settleSection(
    supabase
      .from("reward_rules")
      .select("township_id,action_type,category_slug,points")
      .eq("active", true)
      .or(`township_id.is.null,township_id.eq.${townshipId}`)
  )
})

export function HomeSectionLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={`Loading ${label.toLowerCase()}`}
      className="min-h-28 py-4"
    >
      <span className="sr-only">Loading {label.toLowerCase()}…</span>
      <div
        aria-hidden="true"
        className="h-24 rounded-lg bg-paper motion-safe:animate-pulse"
      />
    </div>
  )
}

export async function HomeTasks() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [bookings, tickets] = await Promise.all([
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
        .gte("events.starts_at", new Date().toISOString())
    ),
  ])
  return (
    <NextSteps
      userId={active.user.id}
      bookings={bookings.data ?? []}
      tickets={tickets.data ?? []}
      failed={Boolean(bookings.error || tickets.error)}
    />
  )
}

export async function HomeFeed({ now }: { now: string }) {
  const active = await requireActiveMember()
  const supabase = await createClient()
  // Only one card of each kind is displayed. Fetch its count with the event,
  // rather than fetching three events and making three more count requests.
  const [itemsResult, eventsResult, helpResult, rulesResult] =
    await Promise.all([
      settleSection(
        supabase
          .from("items")
          .select("id,title,photo_paths,deposit_rm,max_loan_days,owner_id")
          .eq("township_id", active.townshipId)
          .eq("status", "active")
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(1)
      ),
      settleSection(
        supabase
          .from("events")
          .select(
            "id,title,starts_at,location_text,event_categories(slug),event_rsvps(count)"
          )
          .eq("township_id", active.townshipId)
          .eq("status", "published")
          .gte("starts_at", now)
          .in("event_rsvps.status", ["going", "checked_in"])
          .order("starts_at")
          .limit(1)
      ),
      settleSection(
        supabase
          .from("help_requests")
          .select("id,title,kind,needed_by")
          .eq("township_id", active.townshipId)
          .eq("status", "open")
          .neq("requester_id", active.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
      ),
      getHomeRewardRules(active.townshipId),
    ])
  const item = itemsResult.data?.[0]
  const owner = item
    ? await settleSection(
        supabase
          .from("public_profiles")
          .select("id,display_name")
          .eq("id", item.owner_id)
          .maybeSingle()
      )
    : null
  const event = eventsResult.data?.[0]
  const request = helpResult.data?.[0]
  const date = event ? new Date(event.starts_at) : null
  const reward = event
    ? resolveRewardRule(
        rulesResult.data ?? [],
        "event_attendance",
        event.event_categories?.slug
      )?.points
    : null
  const datePart = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      ...options,
    }).format(date!)

  return (
    <>
      <div className="mt-3.5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {item ? (
          <FeedCard
            variant="item"
            href={`/borrow/items/${item.id}`}
            title={item.title}
            meta={`${owner?.data?.display_name ?? "A neighbour"} · ${Number(item.deposit_rm) === 0 ? "free to borrow" : `${formatMoney(item.deposit_rm)} deposit`} · up to ${item.max_loan_days} days`}
            image={item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"}
          />
        ) : null}
        {event ? (
          <FeedCard
            variant="event"
            href={`/events/${event.id}`}
            title={event.title}
            meta={`${formatEventTime(event.starts_at)} · ${event.event_rsvps?.[0]?.count ?? 0} going${reward == null ? "" : ` · up to ${reward} BP after verified check-in`}`}
            date={{
              day: datePart({ weekday: "short" }),
              number: datePart({ day: "numeric" }),
              month: datePart({ month: "short" }),
            }}
          />
        ) : null}
        {request ? (
          <FeedCard
            variant="help"
            href="/community"
            title={request.title}
            meta={`${request.kind.replaceAll("_", " ")} · ${request.needed_by ? formatEventDate(request.needed_by) : "when you can"}`}
          />
        ) : null}
      </div>
      {itemsResult.error ? (
        <SectionRetry label="Borrowing suggestions" />
      ) : null}
      {eventsResult.error ? <SectionRetry label="Upcoming events" /> : null}
      {helpResult.error ? <SectionRetry label="Community requests" /> : null}
      {rulesResult.error ? <SectionRetry label="Reward information" /> : null}
    </>
  )
}

export async function HomeSavedItems() {
  const active = await requireActiveMember()
  const saved = await settleSection(
    getSavedItemIds(active.user.id).then((data) => ({ data, error: null }))
  )
  if (saved.error) return <SectionRetry label="Saved items" />
  const ids = saved.data ?? []
  if (!ids.length) return null
  const supabase = await createClient()
  const result = await settleSection(
    supabase
      .from("items")
      .select(
        "id,title,photo_paths,deposit_rm,max_loan_days,kind,duration_minutes,condition,item_categories(name,slug)"
      )
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .eq("hidden", false)
      .in("id", ids)
  )
  if (result.error) return <SectionRetry label="Saved items" />
  const byId = new Map((result.data ?? []).map((item) => [item.id, item]))
  const items = ids.flatMap((id) => {
    const item = byId.get(id)
    return item ? [item] : []
  })
  return <SavedItemsSection items={items} />
}

export async function HomeRecyclingImpact() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [summary, guide, rules] = await Promise.all([
    settleSection(
      supabase.rpc("resident_recycling_summary", {
        p_township_id: active.townshipId,
        p_user_id: active.user.id,
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
    getHomeRewardRules(active.townshipId),
  ])
  if (summary.error) return <SectionRetry label="Your recycling impact" />
  return (
    <RecyclingImpactSummary
      summary={parseRecyclingSummary(
        (summary.data ?? {}) as Record<string, unknown>
      )}
      guideCompleted={Boolean(guide.data)}
      guideRewardPoints={
        resolveRewardRule(rules.data ?? [], "recycling_guide_completed")
          ?.points ?? 5
      }
    />
  )
}

export async function HomeRecyclingGoal() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const result = await settleSection(
    supabase.rpc("township_recycling_progress", {
      p_township_id: active.townshipId,
    })
  )
  if (result.error) return <SectionRetry label="Township recycling goal" />
  return (
    <TurtleGoalCard
      campaign={parseRecyclingCampaign(
        (result.data ?? {}) as Record<string, unknown>
      )}
    />
  )
}
