import Link from "next/link"
import { notFound } from "next/navigation"

import { EventRsvpActions } from "@/components/events/event-rsvp-actions"
import { ReportForm } from "@/components/reports/report-form"
import { requireActiveMember } from "@/lib/data"
import { formatEventRange } from "@/lib/format"
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
  const [eventResult, rsvpResult] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,description,starts_at,ends_at,location_text,status,capacity,volunteer_slots,accessibility_tags,languages,event_categories(slug,name,counts_as_sustainability)")
      .eq("id", id)
      .eq("township_id", active.townshipId)
      .maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("id,status,role")
      .eq("event_id", id)
      .eq("user_id", active.user.id)
      .maybeSingle(),
  ])

  if (eventResult.error) throw new Error(eventResult.error.message)
  if (!eventResult.data) notFound()
  const event = eventResult.data
  const rsvp = rsvpResult.data

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/events" className="text-sm text-muted-foreground underline underline-offset-4">
        Back to events
      </Link>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={event.event_categories?.counts_as_sustainability ? "text-rimba-ink" : "text-jom-ink"}>
          {event.event_categories?.name ?? "Event"}
        </Badge>
        <Badge variant="secondary">{event.status === "published" ? "Open" : event.status}</Badge>
      </div>
      <h1 className="mt-4 font-heading text-4xl font-semibold">{event.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
      <p className="mt-1 text-muted-foreground">{event.location_text}</p>
      <p className="mt-6 max-w-2xl leading-7">{event.description}</p>

      <div className="mt-8 border-y border-border py-5">
        <h2 className="font-heading text-lg font-semibold">Registration</h2>
        <div className="mt-4">
          <EventRsvpActions eventId={event.id} rsvpStatus={rsvp?.status ?? null} canVolunteer={Boolean(event.volunteer_slots)} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button render={<Link href={`/events/${event.id}/ticket`} />} variant="outline" className="h-11" disabled={!rsvp}>
          Open QR ticket
        </Button>
        <Button render={<Link href={`/events/${event.id}/manage`} />} variant="ghost" className="h-11">
          Manage check-in
        </Button>
      </div>

      {(event.accessibility_tags ?? []).length || (event.languages ?? []).length ? (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">Access and language</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(event.accessibility_tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
            {(event.languages ?? []).map((language) => (
              <Badge key={language} variant="secondary">{language}</Badge>
            ))}
          </div>
        </section>
      ) : null}
      <ReportForm townshipId={active.townshipId} targetType="event" targetId={event.id} />
    </div>
  )
}
