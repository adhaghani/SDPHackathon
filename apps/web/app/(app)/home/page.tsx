import Image from "next/image"
import Link from "next/link"
import { PackageIcon, HandHelpingIcon, WrenchIcon } from "lucide-react"

import { HelpActionButton } from "@/components/community/community-action"
import { PageBand } from "@/components/shared/page-band"
import { PointsChip } from "@/components/shared/points-chip"
import { SectionHeading } from "@/components/shared/section-heading"
import { requireActiveMember } from "@/lib/data"
import { formatEventRange } from "@/lib/format"
import { isFeatureEnabled } from "@/lib/env"
import { recommendEvents, recommendItems } from "@/lib/recommendations"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

const imageTints = ["bg-sun-tint", "bg-mint-tint", "bg-lilac-tint", "bg-coral-tint"]

export default async function HomePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [bookingsResult, eventsResult, itemsResult, ledgerResult, pastEventsResult, helpResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,status,borrower_id,lender_id,items(title)")
      .or(`borrower_id.eq.${active.user.id},lender_id.eq.${active.user.id}`)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("events")
      .select("id,title,starts_at,ends_at,location_text,neighbourhood_id,event_categories(slug,name,counts_as_sustainability)")
      .eq("township_id", active.townshipId)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(3),
    supabase
      .from("items")
      .select("id,title,condition,photo_paths,item_categories(slug,name)")
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .neq("owner_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("points_ledger")
      .select("id,delta,action_type,created_at")
      .eq("user_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("event_rsvps")
      .select("event_id,events(event_categories(slug))")
      .eq("user_id", active.user.id)
      .eq("status", "checked_in")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("help_requests")
      .select("id,title,details,kind,status,needed_by,requester_id")
      .eq("township_id", active.townshipId)
      .eq("status", "open")
      .neq("requester_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ])

  const interests = active.profile?.interests ?? []
  const pastCategories = (pastEventsResult.data ?? [])
    .map((row) => row.events?.event_categories?.slug)
    .filter((slug): slug is string => Boolean(slug))
  const eventRecommendations = isFeatureEnabled("recommendations")
    ? recommendEvents((eventsResult.data ?? []).map((event) => ({
        eventId: event.id,
        title: event.title,
        categorySlug: event.event_categories?.slug ?? "social",
        neighbourhoodId: event.neighbourhood_id,
        startsAt: event.starts_at,
        interests,
        pastCategories,
        userNeighbourhoodId: active.membership?.neighbourhood_id,
      })))
    : []
  const itemRecommendations = isFeatureEnabled("recommendations")
    ? recommendItems((itemsResult.data ?? []).map((item) => ({
        itemId: item.id,
        title: item.title,
        categorySlug: item.item_categories?.slug ?? "events",
        neighbourhoodId: null,
        interests,
        pastCategories,
        userNeighbourhoodId: active.membership?.neighbourhood_id,
      })))
    : []

  const todos = (bookingsResult.data ?? [])
    .map((booking) => {
      if (booking.borrower_id === active.user.id && booking.status === "approved") return { id: booking.id, label: `Confirm handover for ${booking.items?.title ?? "your borrow"}`, href: `/borrow/bookings/${booking.id}` }
      if (booking.borrower_id === active.user.id && booking.status === "handed_over") return { id: booking.id, label: `Mark ${booking.items?.title ?? "your borrow"} returned`, href: `/borrow/bookings/${booking.id}` }
      if (booking.lender_id === active.user.id && booking.status === "requested") return { id: booking.id, label: `Review request for ${booking.items?.title ?? "your item"}`, href: `/borrow/bookings/${booking.id}` }
      if (booking.lender_id === active.user.id && booking.status === "handed_over") return { id: booking.id, label: `Confirm return of ${booking.items?.title ?? "your item"}`, href: `/borrow/bookings/${booking.id}` }
      return null
    })
    .filter((todo): todo is { id: string; label: string; href: string } => Boolean(todo))
    .slice(0, 3)

  const helpRequests = helpResult.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <PageBand
        eyebrow="Good morning"
        title={<>Home, {active.profile?.display_name?.split(" ")[0] ?? "neighbour"}</>}
        description="Find a useful borrow, lend a hand, or see what your township has recognised."
        actions={<PointsChip balance={active.points?.balance ?? 0} />}
      >
        <div>
          <Button render={<Link href="/borrow" />} variant="cta" size="cta">
            Find an item
          </Button>
        </div>
      </PageBand>

      <nav aria-label="Quick actions" className="grid grid-cols-3 gap-3">
        {[
          { href: "/borrow", label: "Borrow", dot: "bg-sun", icon: PackageIcon },
          { href: "/borrow/new", label: "Lend", dot: "bg-mint", icon: WrenchIcon },
          { href: "/community", label: "Help", dot: "bg-lilac", icon: HandHelpingIcon },
        ].map(({ href, label, dot, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bb-card flex min-h-20 flex-col items-center justify-center gap-2 p-3 text-ink transition-transform hover:-translate-y-0.5"
          >
            <span className={`size-5 rounded-full ${dot}`} aria-hidden="true" />
            <Icon aria-hidden="true" className="hidden size-5 text-muted-foreground sm:block" strokeWidth={1.6} />
            <span className="font-display text-base">{label}</span>
          </Link>
        ))}
      </nav>

      <section aria-labelledby="needs-a-hand-heading" className="mt-2">
        <SectionHeading
          title={<span id="needs-a-hand-heading">Needs a hand</span>}
          description="Small, practical requests from neighbours nearby."
          actions={<Button render={<Link href="/community" />} variant="ghost">Open community</Button>}
        />
        {helpRequests.length ? (
          <ul className="mt-4 flex flex-col gap-4">
            {helpRequests.map((request) => (
              <li key={request.id} className="bb-card flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[15px] leading-6 font-bold text-ink">{request.title}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {request.kind.replace("_", " ")}
                    {request.needed_by ? ` · needed by ${new Date(request.needed_by).toLocaleDateString("en-MY")}` : ""}
                  </p>
                </div>
                <HelpActionButton requestId={request.id} action="accept" />
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="bb-card mt-4">
            <EmptyHeader>
              <EmptyTitle>Nothing needs you right now</EmptyTitle>
              <EmptyDescription>Confirmations, handovers and new help requests will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      {todos.length ? (
        <section aria-labelledby="todo-heading" className="mt-2">
          <SectionHeading title={<span id="todo-heading">Your next steps</span>} />
          <ul className="mt-4 flex flex-col gap-3">
            {todos.map((todo) => (
              <li key={todo.id}>
                <Link href={todo.href} className="bb-card flex min-h-14 items-center justify-between gap-3 p-3.5 hover:bg-lilac-tint">
                  <span className="text-[15px] font-bold">{todo.label}</span>
                  <span className="text-sm font-bold text-muted-foreground">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="events-heading" className="mt-2">
        <SectionHeading
          title={<span id="events-heading">Nearby events</span>}
          description="Your neighbourhood first, then the rest of the township."
          actions={<Button render={<Link href="/events" />} variant="ghost">All events</Button>}
        />
        {(eventsResult.data ?? []).length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {eventsResult.data?.map((event, index) => {
              const recommendation = eventRecommendations.find((entry) => entry.item.eventId === event.id)
              return (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="bb-card flex h-full flex-col p-4 hover:bg-lilac-tint">
                  <Badge variant={index % 2 === 0 ? "secondary" : "outline"} className="w-fit">
                    {event.event_categories?.name ?? "Event"}
                  </Badge>
                  <p className="mt-3 font-display text-[15px] text-ink">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
                  {recommendation ? <p className="mt-2 text-xs font-bold text-ink-muted">{recommendation.reason}</p> : null}
                </Link>
              </li>
              )
            })}
          </ul>
        ) : (
          <Empty className="bb-card mt-4">
            <EmptyHeader>
              <EmptyTitle>No events this week</EmptyTitle>
              <EmptyDescription>Host one or browse next week.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      <section aria-labelledby="items-heading" className="mt-2">
        <SectionHeading
          title={<span id="items-heading">Items to borrow</span>}
          description="Useful things your neighbours are sharing."
          actions={<Button render={<Link href="/borrow" />} variant="ghost">Browse borrow</Button>}
        />
        {(itemsResult.data ?? []).length ? (
          <ul className="mt-4 grid gap-3.5 sm:grid-cols-3">
            {itemsResult.data?.map((item, index) => {
              const recommendation = itemRecommendations.find((entry) => entry.item.itemId === item.id)
              return (
                <li key={item.id} className="bb-card overflow-hidden">
                  <Link href={`/borrow/items/${item.id}`} className="flex h-full flex-col">
                    <div className={`flex h-24 items-center justify-center ${imageTints[index % imageTints.length]}`}>
                      {item.photo_paths?.[0] ? (
                        <Image src={item.photo_paths[0]} alt="" width={320} height={180} className="h-full w-full object-cover" />
                      ) : (
                        <PackageIcon aria-hidden="true" className="size-10 text-ink" strokeWidth={1.6} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="font-display text-[15px] text-ink">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.item_categories?.name ?? "Item"} · {item.condition.replace("_", " ")}
                      </p>
                      {recommendation ? <p className="mt-2 text-xs font-bold text-ink-muted">Matches your interests</p> : null}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty className="bb-card mt-4">
            <EmptyHeader>
              <EmptyTitle>No items nearby yet</EmptyTitle>
              <EmptyDescription>Check back after your neighbours list something useful.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      {ledgerResult.data?.length ? (
        <section aria-labelledby="activity-heading" className="mt-2">
          <SectionHeading
            title={<span id="activity-heading">Recent activity</span>}
            actions={<Button render={<Link href="/rewards" />} variant="ghost">Open impact</Button>}
          />
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {ledgerResult.data.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>{describeActivity(row.action_type)}</span>
                <span className={`font-bold tabular-nums ${row.delta > 0 ? "text-ink" : "text-muted-foreground"}`}>
                  {row.delta > 0 ? "+" : ""}{row.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function describeActivity(actionType: string): string {
  const labels: Record<string, string> = {
    event_attendance: "Joined a verified event",
    item_lent_completed: "Completed a neighbour lend",
    item_returned_on_time: "Returned a borrow on time",
    event_hosted: "Hosted a successful event",
  }
  return labels[actionType] ?? actionType.replaceAll("_", " ")
}
