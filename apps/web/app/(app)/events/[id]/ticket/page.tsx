import { notFound } from "next/navigation"

import { TicketClient } from "@/components/events/ticket-client"
import { requireActiveMember } from "@/lib/data"
import { formatEventDate, formatEventTime } from "@/lib/format"
import { resolveRewardRule, type RewardRule } from "@/lib/points"
import { signTicketToken } from "@/lib/qr"
import { createClient } from "@/lib/supabase/server"

export default async function EventTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [eventResult, rsvpResult, profileResult, attendeeResult, rulesResult] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,starts_at,ends_at,location_text,volunteer_slots,event_categories(slug)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("id,status")
      .eq("event_id", id)
      .eq("user_id", active.user.id)
      .maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", active.user.id).maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .in("status", ["going", "checked_in"]),
    supabase
      .from("reward_rules")
      .select("township_id,action_type,category_slug,points")
      .in("action_type", ["event_attendance", "event_volunteer"])
      .or(`township_id.is.null,township_id.eq.${active.townshipId}`),
  ])

  if (!eventResult.data || !rsvpResult.data) notFound()
  const event = eventResult.data
  const rules = (rulesResult.data ?? []) as RewardRule[]
  const categorySlug = event.event_categories?.slug ?? null
  const attendPoints = resolveRewardRule(rules, "event_attendance", categorySlug)?.points ?? 0
  const volunteerPoints = resolveRewardRule(rules, "event_volunteer", categorySlug)?.points ?? 20
  const token = await signTicketToken({
    rsvpId: rsvpResult.data.id,
    eventId: event.id,
    userId: active.user.id,
  })

  return (
    <div className="-mx-4 min-h-[calc(100svh-2rem)] bg-ink px-5 pt-4 pb-32 sm:-mx-6 sm:px-8 md:mx-0 md:rounded-[32px] md:px-8 md:pt-8">
      <TicketClient
        eventId={event.id}
        eventName={event.title}
        attendeeName={profileResult.data?.display_name ?? "Neighbour"}
        initialToken={token}
        dateLabel={formatEventDate(event.starts_at).replace(/ \d{4}$/, "")}
        timeLabel={`${formatEventTime(event.starts_at)}–${formatEventTime(event.ends_at)}`}
        pointsLabel={attendPoints ? `+${attendPoints} BP` : "Verified entry"}
        location={event.location_text}
        attendeeCount={attendeeResult.count ?? 0}
        volunteerSlots={event.volunteer_slots ?? 0}
        volunteerPoints={volunteerPoints}
        startsAt={event.starts_at}
        endsAt={event.ends_at}
      />
    </div>
  )
}
