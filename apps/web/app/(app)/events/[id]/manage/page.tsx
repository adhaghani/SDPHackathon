import { notFound } from "next/navigation"

import { CompleteEventButton } from "@/components/events/complete-event-button"
import { ManualCheckInList } from "@/components/events/manual-check-in-list"
import { QrCheckIn } from "@/components/events/qr-check-in"
import { PageBand } from "@/components/shared/page-band"
import { VolunteerHoursForm } from "@/components/events/volunteer-hours-form"
import { StatusPill } from "@/components/shared/status-pill"
import { requireActiveMember } from "@/lib/data"
import { formatEventRange } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [eventResult, staffResult, registrationsResult] = await Promise.all([
    supabase.from("events").select("id,title,starts_at,ends_at,status,location_text").eq("id", id).maybeSingle(),
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

  const event = eventResult.data
  const going = registrations.filter((row) => row.status === "going" || row.status === "checked_in").length
  const checkedIn = registrations.filter((row) => row.status === "checked_in").length
  const volunteers = registrations.filter((row) => row.role === "volunteer" && row.status === "checked_in")

  return (
    <div className="w-full">
      <PageBand
        back={{ href: `/events/${id}`, label: "Event" }}
        eyebrow="Jom · Check-in desk"
        title={event.title}
        description={`${formatEventRange(event.starts_at, event.ends_at)} · ${event.location_text}`}
        actions={<StatusPill status={event.status} className="px-3 py-1 text-sm" />}
      />

      <dl className="grid grid-cols-3 gap-3">
        {[
          ["Registered", going],
          ["Checked in", checkedIn],
          ["Volunteers in", volunteers.length],
        ].map(([label, value]) => (
          <div key={label} className="bb-card p-4">
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <QrCheckIn eventId={id} />
        <section aria-label="Manual check-in" className="bb-card p-5">
          <ManualCheckInList registrations={registrations} />
        </section>
      </div>

      {volunteers.length ? (
        <section aria-labelledby="hours-heading" className="bb-card mt-6 p-5">
          <h2 id="hours-heading" className="text-title text-ink">Volunteer hours</h2>
          <p className="mt-1 text-sm text-ink-muted">Verify up to four hours per volunteer after check-in.</p>
          <div className="mt-4 flex flex-col gap-4">
            {volunteers.map((registration) => (
              <VolunteerHoursForm key={registration.id} rsvpId={registration.id} name={registration.profiles?.display_name ?? "Neighbour"} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="complete-heading" className="mt-6 rounded-lg bg-lilac-tint p-5">
        <h2 id="complete-heading" className="text-title text-ink">Close the event</h2>
        <p className="mt-1 max-w-[60ch] text-sm text-ink">
          Mark it complete once check-ins are done. Host points are awarded only after at least three staff-verified attendees.
        </p>
        <div className="mt-4">
          <CompleteEventButton eventId={id} disabled={event.status === "completed"} />
        </div>
      </section>
    </div>
  )
}
