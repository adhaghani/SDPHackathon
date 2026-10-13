import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 })

  const [profile, points, bookings, badges] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("points_ledger")
      .select("action_type,delta,reason,created_at")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("bookings")
      .select("status,estimated_value_saved_rm,created_at")
      .eq("borrower_id", user.id)
      .eq("status", "completed")
      .order("created_at"),
    supabase
      .from("user_badges")
      .select("earned_at,badges(name)")
      .eq("user_id", user.id)
      .order("earned_at"),
  ])

  const rows = [
    ["section", "metric", "value", "date"],
    ...points.data?.map((row) => ["bp", row.action_type, String(row.delta), row.created_at]) ?? [],
    ...bookings.data?.map((row) => ["impact", "estimated_value_shared_rm", String(row.estimated_value_saved_rm ?? 0), row.created_at]) ?? [],
    ...badges.data?.map((row) => ["badge", row.badges?.name ?? "Badge", "earned", row.earned_at]) ?? [],
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="borrowbetter-impact-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  })
}
