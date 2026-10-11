import { notFound } from "next/navigation"

import { TicketClient } from "@/components/events/ticket-client"
import { requireActiveMember } from "@/lib/data"
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
  const [eventResult, rsvpResult, profileResult] = await Promise.all([
    supabase.from("events").select("id,title").eq("id", id).maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("id,status")
      .eq("event_id", id)
      .eq("user_id", active.user.id)
      .maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", active.user.id).maybeSingle(),
  ])

  if (!eventResult.data || !rsvpResult.data) notFound()
  const token = await signTicketToken({
    rsvpId: rsvpResult.data.id,
    eventId: eventResult.data.id,
    userId: active.user.id,
  })

  return (
    <div className="py-4">
      <TicketClient
        eventId={eventResult.data.id}
        eventName={eventResult.data.title}
        attendeeName={profileResult.data?.display_name ?? "Neighbour"}
        initialToken={token}
      />
    </div>
  )
}
