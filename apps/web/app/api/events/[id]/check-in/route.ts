import { NextResponse, type NextRequest } from "next/server"

import { verifyTicketToken } from "@/lib/qr"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as { token?: string }
  if (!body.token) {
    return NextResponse.json({ error: "token_required" }, { status: 400 })
  }

  let ticket: { rsvp: string; evt: string; usr: string }
  try {
    ticket = await verifyTicketToken(body.token)
  } catch {
    return NextResponse.json({ error: "invalid_or_expired_ticket" }, { status: 400 })
  }

  if (ticket.evt !== id) {
    return NextResponse.json({ error: "ticket_event_mismatch" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 })
  }

  const [staffResult, eventResult] = await Promise.all([
    supabase.from("event_staff").select("user_id").eq("event_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("events").select("township_id").eq("id", id).maybeSingle(),
  ])
  const memberResult = eventResult.data
    ? await supabase
        .from("township_members")
        .select("role,status")
        .eq("township_id", eventResult.data.township_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null, error: null }

  if (!staffResult.data && memberResult.data?.role !== "township_admin") {
    return NextResponse.json({ error: "not_event_staff" }, { status: 403 })
  }

  const { data, error } = await supabase.rpc("check_in", {
    p_rsvp_id: ticket.rsvp,
    p_method: "qr",
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, data })
}
