import { cache } from "react"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"

export type SessionContext = Awaited<ReturnType<typeof getSessionContext>>

const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getUnreadNotificationCount = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return 0
  const supabase = await createClient()
  const result = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)
  return result.count ?? 0
})

export const getSessionContext = cache(async () => {
  const user = await getCurrentUser()

  if (!user) {
    return { user: null, membership: null, profile: null, points: null }
  }

  const supabase = await createClient()
  const cookieStore = await cookies()
  const selectedTownshipId = cookieStore.get("selected_township_id")?.value
  const [membershipsResult, profileResult, pointsResult] = await Promise.all([
    supabase
      .from("township_members")
      .select(
        "id,township_id,user_id,role,status,neighbourhood_id,unit_label,created_at,townships(name,lifecycle)"
      )
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select(
        "id,display_name,interests,language,comfort_prefs,recognition_opt_in,show_in_highlights"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("v_member_points")
      .select("township_id,balance,lifetime_points,last_activity_at")
      .eq("user_id", user.id),
  ])

  if (membershipsResult.error || profileResult.error || pointsResult.error) {
    throw new Error(
      membershipsResult.error?.message ??
        profileResult.error?.message ??
        pointsResult.error?.message ??
        "Could not load resident context."
    )
  }

  const allMemberships = membershipsResult.data ?? []
  const memberships = allMemberships.filter(
    (row) => row.townships?.lifecycle === "active"
  )
  const preferredMembership = memberships.find(
    (row) => row.status === "active" && row.townships?.name?.includes("Harmoni")
  )
  const membership =
    memberships.find((row) => row.township_id === selectedTownshipId) ??
    preferredMembership ??
    memberships.find((row) => row.status === "active") ??
    memberships[0] ??
    null

  return {
    user,
    membership,
    memberships,
    unavailableMemberships: allMemberships.filter(
      (row) => row.townships?.lifecycle !== "active"
    ),
    profile: profileResult.data,
    points:
      pointsResult.data?.find(
        (row) => row.township_id === membership?.township_id
      ) ?? null,
  }
})

export async function requireActiveMember() {
  const context = await getSessionContext()
  if (
    !context.user ||
    context.membership?.status !== "active" ||
    !context.membership.township_id
  ) {
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
