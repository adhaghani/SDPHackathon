import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDaysIcon, ChevronLeftIcon, MapPinIcon, UserRoundIcon, UsersRoundIcon } from "lucide-react"

import { EventRsvpActions } from "@/components/events/event-rsvp-actions"
import { LazyEventMap } from "@/components/map/lazy-event-map"
import { ReportForm } from "@/components/reports/report-form"
import { DemoLabel } from "@/components/shared/demo-label"
import { MediaPoster } from "@/components/shared/media-poster"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode } from "@/lib/env"
import { formatEventDate, formatEventTime } from "@/lib/format"
import { resolveRewardRule, type RewardRule } from "@/lib/points"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [eventResult, rsvpResult, rulesResult] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,description,cover_path,starts_at,ends_at,location_text,status,capacity,volunteer_slots,accessibility_tags,languages,host_id,event_categories(slug,name,counts_as_sustainability),facilities(name),neighbourhoods(name)")
      .eq("id", id)
      .eq("township_id", active.townshipId)
      .maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("id,status,role")
      .eq("event_id", id)
      .eq("user_id", active.user.id)
      .maybeSingle(),
    supabase
      .from("reward_rules")
      .select("township_id,action_type,category_slug,points,daily_cap,weekly_cap")
      .in("action_type", ["event_attendance", "event_volunteer"])
      .or(`township_id.is.null,township_id.eq.${active.townshipId}`),
  ])

  if (eventResult.error) throw new Error(eventResult.error.message)
  if (!eventResult.data) notFound()
  const event = eventResult.data
  const rsvp = rsvpResult.data
  const categorySlug = event.event_categories?.slug ?? null
  const rules = (rulesResult.data ?? []) as RewardRule[]
  const attendPoints = resolveRewardRule(rules, "event_attendance", categorySlug)?.points
  const volunteerPoints = resolveRewardRule(rules, "event_volunteer", categorySlug)?.points
  const isHost = event.host_id === active.user.id
  const isAdmin = active.membership.role === "township_admin"
  const hostResult = await supabase.from("profiles").select("display_name").eq("id", event.host_id).maybeSingle()
  const host = hostResult.data?.display_name ?? "A neighbour"
  const date = formatEventDate(event.starts_at)
  const time = `${formatEventTime(event.starts_at)}–${formatEventTime(event.ends_at)}`
  const where = `${event.location_text}${event.neighbourhoods?.name ? ` · ${event.neighbourhoods.name}` : ""}`
  const facts = [
    { icon: CalendarDaysIcon, label: date, detail: time },
    { icon: MapPinIcon, label: event.location_text, detail: event.neighbourhoods?.name ? `${event.neighbourhoods.name} · shared space` : "Shared space" },
    { icon: UserRoundIcon, label: `Hosted by ${host}`, detail: event.event_categories?.name ?? "Event" },
    ...(event.capacity || event.volunteer_slots
      ? [{
          icon: UsersRoundIcon,
          label: event.capacity ? `${event.capacity} places` : "Open to all",
          detail: event.volunteer_slots ? `${event.volunteer_slots} volunteer spots` : "No volunteer roles",
        }]
      : []),
  ]

  const registration = (
    <>
      <EventRsvpActions eventId={event.id} rsvpStatus={rsvp?.status ?? null} canVolunteer={Boolean(event.volunteer_slots)} />
      {rsvp || isHost || isAdmin ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {rsvp ? <Button render={<Link href={`/events/${event.id}/ticket`} />} variant="outline">Open QR ticket</Button> : null}
          {isHost || isAdmin ? <Button render={<Link href={`/events/${event.id}/manage`} />} variant="ghost">Manage check-in</Button> : null}
        </div>
      ) : null}
    </>
  )

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/events" />} variant="outline" size="icon" aria-label="Back to events">
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </Button>
        <p className="text-title text-ink">Event</p>
        {isDemoMode() ? <DemoLabel className="ml-auto" /> : null}
      </div>

      <section className="mt-5 grid gap-6 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
        <MediaPoster
          src={event.cover_path ?? "/demo/event-placeholder.svg"}
          alt=""
          priority
          eyebrow={`Jom · ${event.event_categories?.name ?? "Event"}`}
          title={event.title}
          meta={[`${date.replace(/ \d{4}$/, "")} · ${formatEventTime(event.starts_at)}`, event.location_text]}
          sizes="(min-width: 1024px) 22rem, (min-width: 768px) 17rem, 100vw"
        />

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="flex flex-wrap gap-2">
              {event.status !== "published" ? <Badge variant="outline" className="capitalize">{event.status.replace("_", " ")}</Badge> : null}
              {event.event_categories?.counts_as_sustainability ? <Badge className="bg-mint-tint text-ink">Rimba · Sustainability</Badge> : null}
            </div>
            <h1 className="text-display-lg mt-2 text-balance text-ink lg:text-[40px] lg:leading-[44px]">{event.title}</h1>
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex gap-3">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-lilac-tint">
                  <Icon className="size-5 text-ink" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <dt className="font-bold text-ink">{label}</dt>
                  <dd className="text-sm text-ink-muted">{detail}</dd>
                </div>
              </div>
            ))}
          </dl>

          {attendPoints || (event.volunteer_slots && volunteerPoints) ? (
            <div className="grid grid-cols-2 gap-3 lg:max-w-lg">
              {attendPoints ? (
                <div className="rounded-lg bg-sun-tint p-4 text-ink">
                  <p className="text-sm">Attend</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">+{attendPoints} BP</p>
                </div>
              ) : null}
              {event.volunteer_slots && volunteerPoints ? (
                <div className="rounded-lg bg-mint-tint p-4 text-ink">
                  <p className="text-sm">Volunteer (verified hours)</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">+{volunteerPoints} BP</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <section aria-label="Registration" className="bb-card p-5 max-md:hidden lg:max-w-lg">
            {registration}
          </section>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="text-heading text-ink">About</h2>
          <p className="mt-3 max-w-[68ch] text-[17px] leading-7 whitespace-pre-line text-ink">{event.description}</p>
          <p className="mt-3 text-sm text-ink-muted">Points are given after you check in with your QR ticket.</p>
          {(event.accessibility_tags ?? []).length || (event.languages ?? []).length ? (
            <div className="mt-6">
              <h3 className="text-title text-ink">Access and language</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(event.accessibility_tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
                {(event.languages ?? []).map((language) => (
                  <Badge key={language} className="bg-lilac-tint text-ink">{language}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="meetup-heading">
          <h2 id="meetup-heading" className="text-heading text-ink">Meetup point</h2>
          <p className="mt-1 font-bold text-ink">{where}</p>
          <LazyEventMap
            className="mt-3"
            neighbourhood={event.neighbourhoods?.name}
            markers={[{ id: event.id, title: event.title, location: event.location_text, neighbourhood: event.neighbourhoods?.name, facility: event.facilities?.name }]}
          />
          <p className="mt-2 text-sm text-ink-muted">Approximate area for the township. Shared spaces only.</p>
        </section>
      </div>

      <section
        aria-label="Registration"
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-20 -mx-4 mt-8 border-t border-hairline bg-surface px-4 py-3 sm:-mx-6 sm:px-6 md:hidden"
      >
        {registration}
      </section>

      <div className="mt-8">
        <ReportForm townshipId={active.townshipId} targetType="event" targetId={event.id} />
      </div>
    </div>
  )
}
