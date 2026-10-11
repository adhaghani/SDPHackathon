import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type SessionContext = Awaited<ReturnType<typeof getSessionContext>>

export const getSessionContext = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, membership: null, profile: null, points: null }
  }

  const [membershipResult, profileResult, pointsResult] = await Promise.all([
    supabase
      .from("township_members")
      .select("id,township_id,user_id,role,status,neighbourhood_id,unit_label")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("status", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id,display_name,interests,language,comfort_prefs,recognition_opt_in")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("v_member_points")
      .select("township_id,balance,lifetime_points,last_activity_at")
      .eq("user_id", user.id)
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (membershipResult.error || profileResult.error || pointsResult.error) {
    throw new Error(
      membershipResult.error?.message ??
        profileResult.error?.message ??
        pointsResult.error?.message ??
        "Could not load resident context."
    )
  }

  return {
    user,
    membership: membershipResult.data,
    profile: profileResult.data,
    points: pointsResult.data,
  }
})

export async function requireActiveMember() {
  const context = await getSessionContext()
  if (!context.user || context.membership?.status !== "active" || !context.membership.township_id) {
    throw new Error("Active township membership required.")
  }

  return {
    user: context.user,
    membership: context.membership,
    profile: context.profile,
    points: context.points,
    townshipId: context.membership.township_id,
  }
}

export async function getTownshipName(townshipId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("townships")
    .select("name,slug,is_demo")
    .eq("id", townshipId)
    .maybeSingle()

  return data?.name ?? "Your township"
}
