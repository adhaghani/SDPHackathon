import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 })

  const [profile, memberships, points, badges, redemptions] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("township_members").select("township_id,role,status,neighbourhood_id,created_at").eq("user_id", user.id),
    supabase.from("points_ledger").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("user_badges").select("badge_id,township_id,earned_at").eq("user_id", user.id),
    supabase.from("redemptions").select("*").eq("user_id", user.id).order("created_at"),
  ])

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    memberships: memberships.data ?? [],
    points_ledger: points.data ?? [],
    badges: badges.data ?? [],
    redemptions: redemptions.data ?? [],
  })
}
