import Link from "next/link"
import { CalendarDaysIcon, HandHelpingIcon, PackageIcon, PlusIcon } from "lucide-react"

import { HelpActionButton } from "@/components/community/community-action"
import { ActivityRow } from "@/components/home/activity-row"
import { QuickActionCard } from "@/components/home/quick-action-card"
import { TodoRow } from "@/components/home/todo-row"
import { DemoLabel } from "@/components/shared/demo-label"
import { MediaPoster } from "@/components/shared/media-poster"
import { TownshipLine, type StationName } from "@/components/shared/township-line"
import { activityLine, describeActivity, formatRelativeDay, levelProgress, malayGreeting } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { formatEventDate, formatEventTime } from "@/lib/format"
import { recommendEvents } from "@/lib/recommendations"
import { createClient } from "@/lib/supabase/server"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"
import { formatEstimatedMoney } from "@/lib/impact"

type Todo = { id: string; title: string; detail: string; href: string; actionLabel: string; urgent: boolean }

const dueFormat = new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short" })

export default async function HomePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const now = new Date()
  const [bookingsResult, rsvpsResult, eventsResult, ledgerResult, actionsResult, levelsResult, pastEventsResult, helpResult, valueResult, streakResult, carbonResult, highlightResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,status,borrower_id,lender_id,start_date,end_date,handover_method,items(title)")
      .or(`borrower_id.eq.${active.user.id},lender_id.eq.${active.user.id}`)
      .in("status", ["requested", "approved", "handed_over"])
      .order("end_date")
      .limit(10),
    supabase
      .from("event_rsvps")
      .select("id,status,events!inner(id,title,starts_at,location_text)")
      .eq("user_id", active.user.id)
      .eq("status", "going")
      .gte("events.starts_at", now.toISOString())
      .limit(3),
    supabase
      .from("events")
      .select("id,title,cover_path,starts_at,ends_at,location_text,neighbourhood_id,event_categories(slug,name)")
      .eq("township_id", active.townshipId)
      .eq("status", "published")
      .gte("starts_at", now.toISOString())
      .order("starts_at")
      .limit(6),
    supabase
      .from("points_ledger")
      .select("id,delta,action_type,created_at")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("points_ledger")
      .select("action_type")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .gt("delta", 0)
      .limit(1000),
    supabase.from("levels").select("level,name,min_lifetime_points").order("level"),
    supabase
      .from("event_rsvps")
      .select("event_id,events(event_categories(slug))")
      .eq("user_id", active.user.id)
      .eq("status", "checked_in")
      .limit(30),
    supabase
      .from("help_requests")
      .select("id,title,kind,needed_by")
      .eq("township_id", active.townshipId)
      .eq("status", "open")
      .neq("requester_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.rpc("township_value_shared", { p_township_id: active.townshipId }),
    supabase.rpc("compute_user_streak", { p_user_id: active.user.id }),
    supabase.rpc("township_carbon_progress", { p_township_id: active.townshipId }),
    supabase
      .from("monthly_highlights")
      .select("id,month_start,reason,resident_id")
      .eq("township_id", active.townshipId)
      .eq("status", "approved")
      .lte("month_start", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
      .gte("month_start", new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10))
      .order("month_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (valueResult.error) throw new Error(valueResult.error.message)
  if (streakResult.error) throw new Error(streakResult.error.message)
  if (carbonResult.error) throw new Error(carbonResult.error.message)
  if (highlightResult.error) throw new Error(highlightResult.error.message)
  const townshipValue = valueResult.data as { estimated_value_shared_rm?: number } | null
  const streak = streakResult.data as {
    streak_months?: number
    current_month_active?: boolean
    at_risk?: boolean
    next_deadline?: string
  } | null
  const carbon = carbonResult.data as {
    has_goal?: boolean
    available?: boolean
    partial_data?: boolean
    percent?: number
    avoided_co2e_kg?: number
    target_co2e_kg?: number
  } | null
  const highlight = highlightResult.data as {
    id: string
    reason: string
    resident_id: string
  } | null
  const highlightProfile = highlight
    ? (await supabase
        .from("profiles")
        .select("display_name,avatar_path")
        .eq("id", highlight.resident_id)
        .maybeSingle()).data
    : null

  const firstName = active.profile?.display_name?.split(" ")[0] ?? "neighbour"
  const townshipName = active.membership.townships?.name ?? "Your township"
  const lifetime = active.points?.lifetime_points ?? 0
  const level = levelProgress(lifetime, levelsResult.data ?? [])

  const lineCounts = (actionsResult.data ?? []).reduce<Record<string, number>>((counts, row) => {
    const line = activityLine(row.action_type)
    counts[line] = (counts[line] ?? 0) + 1
    return counts
  }, {})
  const stationOrder: StationName[] = ["Pinjam", "Jom", "Tolong", "Rimba"]
  const currentStation = stationOrder.find((line) => !lineCounts[line]) ?? "Rimba"
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`
  const stationDetails: Partial<Record<StationName, string>> = {
    Pinjam: plural(lineCounts.Pinjam ?? 0, "loan"),
    Jom: plural(lineCounts.Jom ?? 0, "event"),
    Tolong: plural(lineCounts.Tolong ?? 0, "help"),
    Rimba: plural(lineCounts.Rimba ?? 0, "challenge"),
    [currentStation]: "Next stop",
  }

  const todos: Todo[] = []
  for (const booking of bookingsResult.data ?? []) {
    const title = booking.items?.title ?? "item"
    const href = `/borrow/bookings/${booking.id}`
    const isBorrower = booking.borrower_id === active.user.id
    const due = dueFormat.format(new Date(`${booking.end_date}T12:00:00+08:00`))
    if (isBorrower && booking.status === "handed_over") {
      todos.push({ id: booking.id, title: `Return the ${title.toLowerCase()}`, detail: `By ${due} · ${booking.handover_method}`, href, actionLabel: "Mark returned", urgent: true })
    } else if (isBorrower && booking.status === "approved") {
      todos.push({ id: booking.id, title: `Collect the ${title.toLowerCase()}`, detail: `From ${dueFormat.format(new Date(`${booking.start_date}T12:00:00+08:00`))} · ${booking.handover_method}`, href, actionLabel: "Confirm handover", urgent: false })
    } else if (!isBorrower && booking.status === "requested") {
      todos.push({ id: booking.id, title: `Confirm a booking request`, detail: `${title} · until ${due}`, href, actionLabel: "Review request", urgent: false })
    } else if (!isBorrower && booking.status === "handed_over") {
      todos.push({ id: booking.id, title: `Confirm your ${title.toLowerCase()} came back`, detail: `Due ${due}`, href, actionLabel: "Confirm return", urgent: false })
    }
  }
  for (const rsvp of rsvpsResult.data ?? []) {
    if (!rsvp.events) continue
    todos.push({
      id: rsvp.id,
      title: `Check in at ${rsvp.events.title}`,
      detail: `${formatEventDate(rsvp.events.starts_at)} ${formatEventTime(rsvp.events.starts_at)} · ${rsvp.events.location_text}`,
      href: `/events/${rsvp.events.id}/ticket`,
      actionLabel: "Open QR ticket",
      urgent: false,
    })
  }
  const visibleTodos = todos.sort((a, b) => Number(b.urgent) - Number(a.urgent)).slice(0, 3)

  const events = eventsResult.data ?? []
  const interests = active.profile?.interests ?? []
  const pastCategories = (pastEventsResult.data ?? [])
    .map((row) => row.events?.event_categories?.slug)
    .filter((slug): slug is string => Boolean(slug))
  const recommendations = isFeatureEnabled("recommendations")
    ? recommendEvents(
        events.map((event) => ({
          eventId: event.id,
          title: event.title,
          categorySlug: event.event_categories?.slug ?? "social",
          neighbourhoodId: event.neighbourhood_id,
          startsAt: event.starts_at,
          interests,
          pastCategories,
          userNeighbourhoodId: active.membership?.neighbourhood_id,
        })),
        events.length
      )
    : []
  const orderedEvents = (recommendations.length
    ? recommendations.map((entry) => events.find((event) => event.id === entry.item.eventId)).filter((event) => event !== undefined)
    : events
  ).slice(0, 3)
  const helpRequests = helpResult.data ?? []
  const demo = isDemoMode()

  return (
    <div className="flex flex-col gap-8">
      <section className="bb-band -mx-4 -mt-6 rounded-b-band px-4 pt-7 pb-8 sm:-mx-6 sm:px-6 md:mx-0 md:mt-0 md:rounded-band md:p-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <p className="text-eyebrow text-band-eyebrow">{townshipName}</p>
              {demo ? <DemoLabel tone="ink" /> : null}
            </div>
            <h1 className="mt-3 font-display text-[34px] leading-[1.05] font-extrabold text-balance text-surface sm:text-5xl">
              {malayGreeting(now)}, {firstName}
            </h1>
            <p className="mt-4 max-w-[60ch] text-base text-band-eyebrow sm:text-lg">
              {level.next ? (
                <>
                  You&apos;re <span className="tabular-nums">{level.toNext.toLocaleString("en-MY")}</span> BP from{" "}
                  <strong className="text-sun">Level {level.next.level} · {level.next.name}</strong>.{" "}
                </>
              ) : (
                <>You&apos;ve reached <strong className="text-sun">{level.current?.name ?? "the top level"}</strong>. </>
              )}
              Points come from verified borrows, events and help.
            </p>
          </div>
          <TownshipLine tone="ink" current={currentStation} details={stationDetails} />
          <p className="mt-4 text-sm text-band-eyebrow">
            Township estimated value shared:{" "}
            <strong className="text-surface tabular-nums">{formatEstimatedMoney(Number(townshipValue?.estimated_value_shared_rm ?? 0))}</strong>{" "}
            · Estimated · <Link href="/admin/methodology" className="underline underline-offset-4">Methodology</Link>
          </p>
          <p className="mt-3 text-sm text-band-eyebrow">
            <strong className="text-surface tabular-nums">{streak?.streak_months ?? 0}-month streak</strong>
            {streak?.at_risk
              ? ` · Borrow or lend by ${streak.next_deadline ? formatEventDate(streak.next_deadline) : "month end"} to keep it`
              : streak?.current_month_active
                ? " · Active this month"
                : ""}
          </p>
          {carbon?.has_goal ? (
            <div className="mt-4">
              {carbon.available ? (
                <>
                  <div className="flex justify-between text-xs font-bold text-band-eyebrow">
                    <span>{townshipName} avoided {Math.round(Number(carbon.avoided_co2e_kg ?? 0)).toLocaleString("en-MY")} of {Math.round(Number(carbon.target_co2e_kg ?? 0)).toLocaleString("en-MY")} kg</span>
                    <span>Estimated</span>
                  </div>
                  <div
                    className="mt-2 h-3 overflow-hidden rounded-full bg-surface"
                    role="progressbar"
                    aria-label="Township carbon goal"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number(carbon.percent ?? 0)}
                  >
                    <div className="h-full bg-mint" style={{ width: `${Math.min(100, Number(carbon.percent ?? 0))}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-band-eyebrow">Carbon goal awaiting documented category factors · Estimated figures are not shown yet.</p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {highlight && highlightProfile ? (
        <section aria-label="Neighbour of the month" className="rounded-lg bg-lilac-tint p-4 text-ink">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-lilac font-display font-extrabold">
              {(highlightProfile.display_name ?? "N").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-eyebrow text-ink-muted">Neighbour of the month</p>
              <p className="font-bold">{highlightProfile.display_name}</p>
              <p className="text-sm text-ink-muted">{highlight.reason}</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 lg:col-start-1 lg:row-start-1 xl:grid-cols-4">
          <QuickActionCard href="/borrow" label="Borrow an item" icon={PackageIcon} tint="coral" />
          <QuickActionCard href="/borrow/new" label="Lend an item" icon={PlusIcon} tint="sun" />
          <QuickActionCard href="/events" label="Join an event" icon={CalendarDaysIcon} tint="lilac" />
          <QuickActionCard href="/community" label="Ask for help" icon={HandHelpingIcon} tint="mint" />
        </nav>

        <aside className="flex flex-col gap-8 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <section aria-labelledby="todo-heading">
            <h2 id="todo-heading" className="text-heading text-ink">To do</h2>
            {visibleTodos.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {visibleTodos.map((todo) => (
                  <TodoRow key={todo.id} {...todo} />
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">
                Nothing waiting on you. Returns, booking requests and event check-ins will show up here.
              </p>
            )}
          </section>

          <section aria-labelledby="activity-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="activity-heading" className="text-heading text-ink">Recent activity</h2>
              <Link href="/rewards/activity" className="text-sm font-bold text-ink underline underline-offset-4">All activity</Link>
            </div>
            {ledgerResult.data?.length ? (
              <ul className="bb-card mt-4 divide-y divide-hairline">
                {ledgerResult.data.map((row) => (
                  <ActivityRow
                    key={row.id}
                    title={describeActivity(row.action_type)}
                    detail={`${activityLine(row.action_type)} · ${formatRelativeDay(row.created_at, now)}`}
                    delta={row.delta}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">
                Your first verified borrow, event or helping hand will appear here with its BetterPoints.
              </p>
            )}
          </section>
        </aside>

        <section aria-labelledby="events-heading" className="lg:col-start-1">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="events-heading" className="text-heading text-ink">Nearby events</h2>
            <Link href="/events" className="text-sm font-bold text-ink underline underline-offset-4">All events</Link>
          </div>
          {orderedEvents.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {orderedEvents.map((event, index) => (
                <li key={event.id} className={index === 2 ? "max-sm:hidden" : undefined}>
                  <Link href={`/events/${event.id}`} className="block rounded-lg transition-shadow duration-150 ease-out hover:shadow-raised">
                    <MediaPoster
                      src={event.cover_path ?? "/demo/event-placeholder.svg"}
                      alt=""
                      eyebrow={`Jom · ${event.event_categories?.name ?? "Event"}`}
                      title={event.title}
                      meta={`${formatEventDate(event.starts_at).replace(/ \d{4}$/, "")} · ${event.location_text}`}
                      sizes="(min-width: 1024px) 20vw, 50vw"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="bb-card mt-4">
              <EmptyHeader>
                <EmptyTitle>No events coming up</EmptyTitle>
                <EmptyDescription>
                  Host one at a shared space, or <Link href="/events" className="underline underline-offset-4">browse past events</Link>.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        {helpRequests.length ? (
          <section aria-labelledby="help-heading" className="lg:col-start-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="help-heading" className="text-heading text-ink">
                Tolong <span className="text-ink-muted">· Needs a hand</span>
              </h2>
              <Link href="/community" className="text-sm font-bold text-ink underline underline-offset-4">Community</Link>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {helpRequests.map((request) => (
                <li key={request.id} className="bb-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="font-bold text-ink">{request.title}</p>
                    <p className="mt-0.5 text-sm text-ink-muted first-letter:uppercase">
                      {request.kind.replaceAll("_", " ")}
                      {request.needed_by ? ` · needed by ${formatEventDate(request.needed_by)}` : ""}
                    </p>
                  </div>
                  <HelpActionButton requestId={request.id} action="accept" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}
