"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { requirePlatformAdmin } from "@/lib/platform"
import { getAppUrl, getPublishableKey, getSupabaseUrl } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import {
  boundarySchema,
  managerSchema,
  townshipError,
  townshipSchema,
} from "@/lib/validation/township"

export type PlatformActionState = {
  status: "idle" | "error" | "success"
  message?: string
  id?: string
}

export async function saveTownship(
  _state: PlatformActionState,
  formData: FormData
): Promise<PlatformActionState> {
  const { supabase } = await requirePlatformAdmin()
  let boundary: unknown
  try {
    boundary = JSON.parse(String(formData.get("boundary") || "null"))
  } catch {
    boundary = null
  }
  const parsed = townshipSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    join_code: formData.get("join_code"),
    state: formData.get("state"),
    district: formData.get("district"),
    description: formData.get("description"),
    boundary,
    neighbourhoods: String(formData.get("neighbourhoods") || "")
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean),
    lifecycle: formData.get("lifecycle"),
    auto_approve_members: formData.get("auto_approve_members") === "on",
    require_event_approval: formData.get("require_event_approval") === "on",
    acknowledge_overlaps: formData.get("acknowledge_overlaps") === "on",
  })
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues.some((i) => i.path[0] === "boundary")
        ? "Draw and close a valid township boundary before saving."
        : "Check the township details and add at least one neighbourhood.",
    }
  const id = formData.get("id")
  if (id && !/^[0-9a-f-]{36}$/i.test(String(id)))
    return { status: "error", message: "Invalid township." }
  if (
    !id &&
    !managerSchema.safeParse({
      townshipId: "00000000-0000-4000-8000-000000000000",
      displayName: formData.get("managerName"),
      email: formData.get("managerEmail"),
    }).success
  )
    return {
      status: "error",
      message: "Enter the first manager’s name and a valid email address.",
    }
  const { data, error } = await supabase.rpc("platform_save_township", {
    p_data: parsed.data,
    p_township_id: id ? String(id) : undefined,
  })
  if (error) return { status: "error", message: townshipError(error.message) }
  if (!id) {
    const appointment = new FormData()
    appointment.set("townshipId", data)
    appointment.set("displayName", String(formData.get("managerName") || ""))
    appointment.set("email", String(formData.get("managerEmail") || ""))
    const managerResult = await appointManager({ status: "idle" }, appointment)
    revalidatePath("/superadmin", "layout")
    redirect(
      `/superadmin/townships/${data}?saved=1${managerResult.status === "error" ? "&invitation=failed" : ""}`
    )
  }
  revalidatePath("/superadmin", "layout")
  redirect(`/superadmin/townships/${data}?saved=1`)
}

export async function checkBoundary(
  boundary: unknown,
  townshipId?: string
): Promise<{ names: string[]; error?: string }> {
  const { supabase } = await requirePlatformAdmin()
  const parsed = boundarySchema.safeParse(boundary)
  if (!parsed.success)
    return {
      names: [],
      error: "Draw and close a boundary with at least three points.",
    }
  const { data, error } = await supabase.rpc("platform_boundary_overlaps", {
    p_boundary: parsed.data,
    p_township_id: townshipId,
  })
  if (error) return { names: [], error: townshipError(error.message) }
  return { names: (data as { name: string }[]).map((t) => t.name) }
}

export async function appointManager(
  _state: PlatformActionState,
  formData: FormData
): Promise<PlatformActionState> {
  const { supabase } = await requirePlatformAdmin()
  const parsed = managerSchema.safeParse({
    townshipId: formData.get("townshipId"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
  })
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter the manager’s name and a valid email address.",
    }
  const { townshipId, email, displayName } = parsed.data
  const { data, error } = await supabase.rpc("platform_prepare_manager", {
    p_township_id: townshipId,
    p_email: email,
    p_display_name: displayName,
  })
  if (error) return { status: "error", message: townshipError(error.message) }
  const invitation = data as { id: string; status: string }
  if (invitation.status === "accepted") {
    revalidatePath("/superadmin", "layout")
    return {
      status: "success",
      message: "Existing verified account appointed as manager.",
    }
  }
  // Use an implicit email flow: PKCE here would bind the manager’s link to the
  // superadmin’s browser. The invitation page consumes the resulting fragment.
  const mailClient = createSupabaseClient(
    getSupabaseUrl(),
    getPublishableKey(),
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
  const { error: mailError } = await mailClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getAppUrl()}/manager-invitation`,
      data: { display_name: displayName },
    },
  })
  const { error: deliveryError } = await supabase.rpc(
    "platform_record_delivery",
    { p_id: invitation.id, p_succeeded: !mailError }
  )
  revalidatePath("/superadmin", "layout")
  if (deliveryError)
    return {
      status: "error",
      message:
        "Invitation delivery could not be recorded. Refresh and retry before activating the township.",
    }
  if (mailError)
    return {
      status: "error",
      message:
        "The manager was saved, but email could not be sent. Check Supabase Auth SMTP and retry.",
    }
  return {
    status: "success",
    message:
      "Invitation sent. The manager can choose a password and accept their appointment.",
  }
}

export async function revokeManager(
  _state: PlatformActionState,
  formData: FormData
): Promise<PlatformActionState> {
  const { supabase } = await requirePlatformAdmin()
  const id = String(formData.get("invitationId") || "")
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return { status: "error", message: "Invalid invitation." }
  const { error } = await supabase.rpc("platform_revoke_manager", { p_id: id })
  if (error) return { status: "error", message: townshipError(error.message) }
  revalidatePath("/superadmin", "layout")
  return {
    status: "success",
    message: "Manager access and the pending appointment have been revoked.",
  }
}

export async function acceptManager(
  _state: PlatformActionState,
  formData: FormData
): Promise<PlatformActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return {
      status: "error",
      message: "Your link has expired. Ask your superadmin to resend it.",
    }
  const password = String(formData.get("password") || "")
  if (
    password.length < 12 ||
    password.length > 128 ||
    password !== formData.get("confirmPassword") ||
    formData.get("acceptedTerms") !== "on"
  )
    return {
      status: "error",
      message:
        "Use matching passwords of 12–128 characters and accept the terms and privacy policy.",
    }
  const { data: pending, error: pendingError } = await supabase.rpc(
    "my_manager_invitations"
  )
  if (pendingError || !Array.isArray(pending) || !pending.length)
    return {
      status: "error",
      message:
        "No active invitation was found for your account. Ask your superadmin to resend it.",
    }
  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError)
    return {
      status: "error",
      message:
        "The password could not be saved. Choose a different strong password and try again.",
    }
  const { data, error } = await supabase.rpc("accept_manager_invitations")
  if (error)
    return {
      status: "error",
      message:
        "Your appointment is no longer available. Contact your superadmin.",
    }
  const cookieStore = await cookies()
  cookieStore.set("selected_township_id", String(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: getAppUrl().startsWith("https://"),
    path: "/",
  })
  revalidatePath("/", "layout")
  redirect("/admin")
}
