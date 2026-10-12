import Link from "next/link"
import { notFound } from "next/navigation"

import { EventRsvpActions } from "@/components/events/event-rsvp-actions"
import { PageBand } from "@/components/shared/page-band"
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
      <PageBand
        eyebrow={event.event_categories?.name ?? "Event"}
        title={event.title}
        description={`${formatEventRange(event.starts_at, event.ends_at)} · ${event.location_text}`}
        actions={<Button render={<Link href="/events" />} variant="outline">Back to events</Button>}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-sun text-ink">{event.status === "published" ? "Open" : event.status}</Badge>
          {event.event_categories?.counts_as_sustainability ? <Badge variant="secondary">Sustainability</Badge> : null}
        </div>
      </PageBand>
      <p className="max-w-2xl leading-7">{event.description}</p>

      <div className="mt-8 border-y border-border py-5">
        <h2 className="font-display text-lg">Registration</h2>
        <div className="mt-4">
          <EventRsvpActions eventId={event.id} rsvpStatus={rsvp?.status ?? null} canVolunteer={Boolean(event.volunteer_slots)} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button render={<Link href={`/events/${event.id}/ticket`} />} variant="outline" className="min-h-11" disabled={!rsvp}>
          Open QR ticket
        </Button>
        <Button render={<Link href={`/events/${event.id}/manage`} />} variant="ghost" className="min-h-11">
          Manage check-in
        </Button>
      </div>

      {(event.accessibility_tags ?? []).length || (event.languages ?? []).length ? (
        <section className="mt-8">
          <h2 className="font-display text-lg">Access and language</h2>
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
