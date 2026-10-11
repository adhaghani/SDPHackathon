import { NextResponse, type NextRequest } from "next/server"

import { signTicketToken } from "@/lib/qr"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 })
  }

  const rsvp = await supabase
    .from("event_rsvps")
    .select("id,event_id,user_id,status")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (rsvp.error || !rsvp.data) {
    return NextResponse.json({ error: "rsvp_not_found" }, { status: 404 })
  }

  const token = await signTicketToken({
    rsvpId: rsvp.data.id,
    eventId: id,
    userId: user.id,
  })

  return NextResponse.json({ token, expiresInSeconds: 90 })
}
