import { cache } from "react"
import { cookies } from "next/headers"

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

  const cookieStore = await cookies()
  const selectedTownshipId = cookieStore.get("selected_township_id")?.value
  const [membershipsResult, profileResult] = await Promise.all([
    supabase
      .from("township_members")
      .select("id,township_id,user_id,role,status,neighbourhood_id,unit_label,created_at,townships(name)")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id,display_name,interests,language,comfort_prefs,recognition_opt_in")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  if (membershipsResult.error || profileResult.error) {
    throw new Error(
      membershipsResult.error?.message ??
        profileResult.error?.message ??
        "Could not load resident context."
    )
  }

  const memberships = membershipsResult.data ?? []
  const preferredMembership = memberships.find(
    (row) => row.status === "active" && row.townships?.name?.includes("Harmoni")
  )
  const membership =
    memberships.find((row) => row.township_id === selectedTownshipId) ??
    preferredMembership ??
    memberships.find((row) => row.status === "active") ??
    memberships[0] ??
    null

  const pointsResult = membership
    ? await supabase
        .from("v_member_points")
        .select("township_id,balance,lifetime_points,last_activity_at")
        .eq("user_id", user.id)
        .eq("township_id", membership.township_id)
        .maybeSingle()
    : { data: null, error: null }

  if (pointsResult.error) throw new Error(pointsResult.error.message)

  return {
    user,
    membership,
    memberships,
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
    memberships: context.memberships,
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
