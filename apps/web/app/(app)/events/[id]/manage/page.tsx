import Link from "next/link"
import { notFound } from "next/navigation"

import { CompleteEventButton } from "@/components/events/complete-event-button"
import { ManualCheckInList } from "@/components/events/manual-check-in-list"
import { QrCheckIn } from "@/components/events/qr-check-in"
import { PageBand } from "@/components/shared/page-band"
import { VolunteerHoursForm } from "@/components/events/volunteer-hours-form"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"

export default async function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [eventResult, staffResult, registrationsResult] = await Promise.all([
    supabase.from("events").select("id,title,starts_at,ends_at,status").eq("id", id).maybeSingle(),
    supabase.from("event_staff").select("user_id").eq("event_id", id).eq("user_id", active.user.id).maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("id,user_id,status,role,checked_in_at")
      .eq("event_id", id)
      .order("created_at")
  ])

  if (!eventResult.data) notFound()
  if (!staffResult.data && active.membership?.role !== "township_admin") notFound()
  if (registrationsResult.error) throw new Error(registrationsResult.error.message)

  const userIds = (registrationsResult.data ?? []).map((registration) => registration.user_id)
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", userIds)
    : { data: [], error: null }
  if (profilesResult.error) throw new Error(profilesResult.error.message)
  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.display_name]))
  const registrations = (registrationsResult.data ?? []).map((registration) => ({
    ...registration,
    profiles: profileMap.has(registration.user_id)
      ? { display_name: profileMap.get(registration.user_id) ?? "Neighbour" }
      : null,
  }))

  return (
    <div className="mx-auto max-w-3xl">
      <PageBand
        eyebrow="Check-in desk"
        title={eventResult.data.title}
        description="Use the camera path when available, or search registrations for an accessible manual check-in."
        actions={<Button render={<Link href={`/events/${id}`} />} variant="outline">Back to event</Button>}
      >
        <Badge variant="secondary" className="w-fit bg-sun text-ink">{eventResult.data.status}</Badge>
      </PageBand>
      <div className="mt-7">
        <QrCheckIn eventId={id} />
        <ManualCheckInList registrations={registrations} />
      </div>
      {registrations.some((registration) => registration.role === "volunteer" && registration.status === "checked_in") ? (
        <section className="mt-7 border-t border-border pt-6">
          <h2 className="font-display text-lg">Volunteer hours</h2>
          <p className="mt-1 text-sm text-muted-foreground">Verify up to four hours per volunteer after check-in.</p>
          <div className="mt-4 flex flex-col gap-4">
            {registrations
              .filter((registration) => registration.role === "volunteer" && registration.status === "checked_in")
              .map((registration) => (
                <VolunteerHoursForm key={registration.id} rsvpId={registration.id} name={registration.profiles?.display_name ?? "Neighbour"} />
              ))}
          </div>
        </section>
      ) : null}
      <div className="mt-7 border-t border-border pt-5">
        <CompleteEventButton eventId={id} disabled={eventResult.data.status === "completed"} />
        <Alert className="mt-4">
          <AlertDescription>
            Host points are awarded only after at least three staff-verified attendees.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
