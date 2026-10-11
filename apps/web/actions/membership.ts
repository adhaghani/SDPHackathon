"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  joinCodeSchema,
  joinTownshipSchema,
} from "@/lib/validation/membership"

export type MembershipActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
  details?: {
    township_id: string
    name: string
    auto_approve_members: boolean
    neighbourhoods: Array<{ id: string; name: string }>
    joinCode: string
  }
}

const idleState: MembershipActionState = { status: "idle" }

function errorState(message: string): MembershipActionState {
  return { status: "error", message }
}

export async function resolveJoinCode(
  _state: MembershipActionState,
  formData: FormData
): Promise<MembershipActionState> {
  const parsed = joinCodeSchema.safeParse({ joinCode: formData.get("joinCode") })
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the join code.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_join_details", {
    p_join_code: parsed.data.joinCode,
  })
  if (error) return errorState("We could not check that code. Try again.")

  const details = data as MembershipActionState["details"] & { error?: string }
  if (!details || details.error === "invalid_join_code") {
    return errorState("That join code is not valid. Check it with your township office.")
  }

  return { status: "success", details: { ...details, joinCode: parsed.data.joinCode } }
}

export async function joinTownship(
  _state: MembershipActionState,
  formData: FormData
): Promise<MembershipActionState> {
  const parsed = joinTownshipSchema.safeParse({
    joinCode: formData.get("joinCode"),
    neighbourhoodId: formData.get("neighbourhoodId"),
    unitLabel: formData.get("unitLabel") || undefined,
  })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_township", {
    p_join_code: parsed.data.joinCode,
    p_neighbourhood_id: parsed.data.neighbourhoodId,
    p_unit_label: parsed.data.unitLabel,
  })

  if (error) {
    if (error.message.includes("invalid_join_code")) {
      return errorState("That join code is not valid.")
    }
    if (error.message.includes("invalid_neighbourhood")) {
      return errorState("Choose a neighbourhood from the list.")
    }
    return errorState("We could not complete membership yet. Try again.")
  }

  const result = data as { status?: string }
  if (result.status === "active") {
    redirect("/home")
  }

  redirect("/onboarding?joined=1")
}

export async function switchTownship(
  _state: MembershipActionState,
  formData: FormData
): Promise<MembershipActionState> {
  const townshipId = formData.get("townshipId")
  if (typeof townshipId !== "string") return { status: "error", message: "Choose a township." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { status: "error", message: "Sign in before switching townships." }

  const membership = await supabase
    .from("township_members")
    .select("township_id,status")
    .eq("user_id", user.id)
    .eq("township_id", townshipId)
    .eq("status", "active")
    .maybeSingle()
  if (membership.error || !membership.data) {
    return { status: "error", message: "You do not have an active membership in that township." }
  }

  const cookieStore = await cookies()
  cookieStore.set("selected_township_id", townshipId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
  redirect("/home")
}

