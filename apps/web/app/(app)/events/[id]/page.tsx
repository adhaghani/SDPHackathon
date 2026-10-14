import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react"

import { EventTools } from "@/components/events/event-tools"
import { EventRsvpActions } from "@/components/events/event-rsvp-actions"
import { LazyEventMap } from "@/components/map/lazy-event-map"
import { ReportForm } from "@/components/reports/report-form"
import { PageBand } from "@/components/shared/page-band"
import { MediaPoster } from "@/components/shared/media-poster"
import { requireActiveMember } from "@/lib/data"
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
      .select(
        "id,title,description,cover_path,starts_at,ends_at,location_text,status,capacity,volunteer_slots,accessibility_tags,languages,host_id,event_categories(slug,name,counts_as_sustainability),facilities(name),neighbourhoods(name)"
      )
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
      .select(
        "township_id,action_type,category_slug,points,daily_cap,weekly_cap"
      )
      .in("action_type", ["event_attendance", "event_volunteer"])
      .eq("active", true)
      .or(`township_id.is.null,township_id.eq.${active.townshipId}`),
  ])

  if (eventResult.error) throw new Error(eventResult.error.message)
  if (!eventResult.data) notFound()
  const event = eventResult.data
  const rsvp = rsvpResult.data
  const categorySlug = event.event_categories?.slug ?? null
  const rules = (rulesResult.data ?? []) as RewardRule[]
  const attendPoints = resolveRewardRule(
    rules,
    "event_attendance",
    categorySlug
  )?.points
  const volunteerPoints = resolveRewardRule(
    rules,
    "event_volunteer",
    categorySlug
  )?.points
  const isHost = event.host_id === active.user.id
  const isAdmin = active.membership.role === "township_admin"
  const hostResult = await supabase
    .from("public_profiles")
    .select("display_name")
    .eq("id", event.host_id)
    .maybeSingle()
  const host = hostResult.data?.display_name ?? "A neighbour"
  const date = formatEventDate(event.starts_at)
  const time = `${formatEventTime(event.starts_at)}–${formatEventTime(event.ends_at)}`
  const where = `${event.location_text}${event.neighbourhoods?.name ? ` · ${event.neighbourhoods.name}` : ""}`
  const facts = [
    { icon: CalendarDaysIcon, label: date, detail: time },
    {
      icon: MapPinIcon,
      label: event.location_text,
      detail: event.neighbourhoods?.name
        ? `${event.neighbourhoods.name} · shared space`
        : "Shared space",
    },
    {
      icon: UserRoundIcon,
      label: `Hosted by ${host}`,
      detail: event.event_categories?.name ?? "Event",
    },
    ...(event.capacity || event.volunteer_slots
      ? [
          {
            icon: UsersRoundIcon,
            label: event.capacity ? `${event.capacity} places` : "Open to all",
            detail: event.volunteer_slots
              ? `${event.volunteer_slots} volunteer spots`
              : "No volunteer roles",
          },
        ]
      : []),
  ]

  const registrationOpen =
    event.status === "published" &&
    new Date(event.ends_at).getTime() > Date.now()
  const registration = (
    <>
      {registrationOpen ||
      rsvp?.status === "going" ||
      rsvp?.status === "checked_in" ||
      rsvp?.status === "waitlisted" ? (
        <EventRsvpActions
          eventId={event.id}
          rsvpStatus={rsvp?.status ?? null}
          canVolunteer={Boolean(event.volunteer_slots)}
        />
      ) : (
        <p className="font-bold">
          {event.status === "cancelled"
            ? "This event has been cancelled."
            : "Registration is closed."}
        </p>
      )}
      {isHost || isAdmin ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {isHost || isAdmin ? (
            <Button
              render={<Link href={`/events/${event.id}/manage`} />}
              variant="ghost"
            >
              Manage check-in
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        back={{ href: "/events", label: "Events" }}
        title={event.title}
        description={event.event_categories?.name ?? "Community event"}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:gap-10">
        <MediaPoster
          src={event.cover_path ?? "/demo/event-placeholder.svg"}
          alt=""
          priority
          ratio="aspect-[4/3] lg:aspect-[3/4]"
          sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 17rem, (min-width: 768px) 60vw, 100vw"
        />

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="flex flex-wrap gap-2">
              {event.status !== "published" ? (
                <Badge variant="outline" className="capitalize">
                  {event.status.replace("_", " ")}
                </Badge>
              ) : null}
              {event.event_categories?.counts_as_sustainability ? (
                <Badge className="bg-lime text-ink">
                  RIMBA · Sustainability
                </Badge>
              ) : null}
            </div>
            <h2 className="mt-2 text-h2 text-balance">Event details</h2>
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="relative min-w-0 pl-13">
                <dt className="font-bold text-ink">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 grid size-10 place-items-center rounded-lg bg-sky"
                  >
                    <Icon className="size-5 text-ink" strokeWidth={1.8} />
                  </span>
                  {label}
                </dt>
                <dd className="text-sm text-ink-muted">{detail}</dd>
              </div>
            ))}
          </dl>

          {attendPoints || (event.volunteer_slots && volunteerPoints) ? (
            <div className="grid grid-cols-2 gap-3 lg:max-w-lg">
              {attendPoints ? (
                <div className="rounded-lg bg-sun-tint p-4 text-ink">
                  <p className="text-sm">Attend</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">
                    +{attendPoints} BP
                  </p>
                </div>
              ) : null}
              {event.volunteer_slots && volunteerPoints ? (
                <div className="rounded-lg bg-mint-tint p-4 text-ink">
                  <p className="text-sm">Volunteer (verified hours)</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">
                    +{volunteerPoints} BP
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <section
            aria-label="Registration"
            className="rounded-[20px] bg-paper p-4"
          >
            {registration}
          </section>
          <EventTools
            id={event.id}
            title={event.title}
            startsAt={event.starts_at}
            endsAt={event.ends_at}
            location={where}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="text-heading text-ink">
            About
          </h2>
          <p className="mt-3 max-w-[68ch] text-[17px] leading-7 whitespace-pre-line text-ink">
            {event.description}
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Points are given after you check in with your QR ticket.
          </p>
          {(event.accessibility_tags ?? []).length ||
          (event.languages ?? []).length ? (
            <div className="mt-6">
              <h3 className="text-title text-ink">Access and language</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(event.accessibility_tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {(event.languages ?? []).map((language) => (
                  <Badge key={language} className="bg-lilac-tint text-ink">
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="meetup-heading">
          <h2 id="meetup-heading" className="text-heading text-ink">
            Meetup point
          </h2>
          <p className="mt-1 font-bold text-ink">{where}</p>
          <LazyEventMap
            className="mt-3"
            neighbourhood={event.neighbourhoods?.name}
            markers={[
              {
                id: event.id,
                title: event.title,
                location: event.location_text,
                neighbourhood: event.neighbourhoods?.name,
                facility: event.facilities?.name,
              },
            ]}
          />
          <p className="mt-2 text-sm text-ink-muted">
            Approximate area for the township. Shared spaces only.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <ReportForm
          townshipId={active.townshipId}
          targetType="event"
          targetId={event.id}
        />
      </div>
    </div>
  )
}
