"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export type GuestAdminState = {
  status: "idle" | "error" | "success"
  message?: string
  data?: unknown
}

const gateSchema = z.object({ name: z.string().trim().min(1).max(80), gateId: z.uuid().optional() })
const guardSchema = z.object({ memberId: z.uuid(), assign: z.enum(["true", "false"]) })
const settingsSchema = z.object({
  maxValidityDays: z.coerce.number().int().min(1).max(30),
  maxActivePasses: z.coerce.number().int().min(1).max(100),
  maxDaysAhead: z.coerce.number().int().min(1).max(90),
  maxCreates: z.coerce.number().int().min(1).max(100),
  retentionDays: z.coerce.number().int().min(30).max(365),
  overstayGrace: z.coerce.number().int().min(5).max(1440),
  walkInTimeout: z.coerce.number().int().min(1).max(60),
})

function error(message: string): GuestAdminState {
  return { status: "error", message }
}

async function adminContext() {
  const active = await requireActiveMember()
  if (active.membership.role !== "township_admin") return null
  return active
}

async function assignerContext() {
  const active = await requireActiveMember()
  if (!["township_admin", "organiser"].includes(active.membership.role)) return null
  return active
}

export async function saveGuestGate(
  _state: GuestAdminState,
  formData: FormData
): Promise<GuestAdminState> {
  const active = await adminContext()
  if (!active) return error("Admin access required.")
  const parsed = gateSchema.safeParse({ name: formData.get("name"), gateId: formData.get("gateId") || undefined })
  if (!parsed.success) return error("Enter a gate name.")

  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("save_guest_gate", {
    p_township_id: active.townshipId,
    p_name: parsed.data.name,
    p_gate_id: parsed.data.gateId || undefined,
  })
  if (rpcError) return error(rpcError.message.includes("duplicate") ? "A gate with that name already exists." : "The gate could not be saved.")
  revalidatePath("/admin/guests")
  return { status: "success", message: "Gate saved.", data }
}

export async function assignGuestGuard(
  _state: GuestAdminState,
  formData: FormData
): Promise<GuestAdminState> {
  const active = await assignerContext()
  if (!active) return error("Admin or organiser access required.")
  const parsed = guardSchema.safeParse({ memberId: formData.get("memberId"), assign: formData.get("assign") })
  if (!parsed.success) return error("That membership is not available.")

  const supabase = await createClient()
  const { error: rpcError } = await supabase.rpc("assign_guest_guard", {
    p_member_id: parsed.data.memberId,
    p_assign: parsed.data.assign === "true",
  })
  if (rpcError) return error(rpcError.message.includes("protected") ? "Admin roles cannot be assigned as guards here." : "That role could not be updated.")
  revalidatePath("/admin/guests")
  revalidatePath("/admin/members")
  return { status: "success", message: parsed.data.assign === "true" ? "Guard assigned." : "Guard role removed." }
}

export async function saveGuestPassSettings(
  _state: GuestAdminState,
  formData: FormData
): Promise<GuestAdminState> {
  const active = await adminContext()
  if (!active) return error("Admin access required.")
  const parsed = settingsSchema.safeParse({
    maxValidityDays: formData.get("maxValidityDays"),
    maxActivePasses: formData.get("maxActivePasses"),
    maxDaysAhead: formData.get("maxDaysAhead"),
    maxCreates: formData.get("maxCreates"),
    retentionDays: formData.get("retentionDays"),
    overstayGrace: formData.get("overstayGrace"),
    walkInTimeout: formData.get("walkInTimeout"),
  })
  if (!parsed.success) return error("Check the guest-pass limits.")

  const supabase = await createClient()
  const { error: rpcError } = await supabase.rpc("set_guest_pass_settings", {
    p_township_id: active.townshipId,
    p_settings: {
      max_validity_days: parsed.data.maxValidityDays,
      max_active_passes_per_resident: parsed.data.maxActivePasses,
      max_days_ahead: parsed.data.maxDaysAhead,
      max_creates_per_resident_per_day: parsed.data.maxCreates,
      retention_days: parsed.data.retentionDays,
      overstay_grace_minutes: parsed.data.overstayGrace,
      walk_in_timeout_minutes: parsed.data.walkInTimeout,
    },
  })
  if (rpcError) return error("The guest-pass settings could not be saved.")
  revalidatePath("/admin/guests")
  revalidatePath("/admin/methodology")
  return { status: "success", message: "Guest-pass settings saved." }
}
