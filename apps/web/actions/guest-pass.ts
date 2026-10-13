"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { createGuestPassSecrets, hashToByteaInput, sha256Hex } from "@/lib/guest-pass-token"
import { z } from "zod"

export type GuestPassActionState = {
  status: "idle" | "error" | "success"
  message?: string
  passId?: string
  token?: string
  shortCode?: string
}

const createSchema = z.object({
  visitorName: z.string().trim().min(1).max(100),
  validFrom: z.string().datetime({ offset: true }),
  validUntil: z.string().datetime({ offset: true }),
  maxEntries: z.coerce.number().int().min(1).max(100).default(1),
  visitorPhone: z.string().trim().max(40).optional(),
  vehiclePlate: z.string().trim().max(24).optional(),
  purpose: z.string().trim().max(80).optional(),
})

const revokeSchema = z.object({ passId: z.uuid() })
const muteSchema = z.object({ passId: z.uuid(), mute: z.enum(["true", "false"]) })

function errorState(message: string): GuestPassActionState {
  return { status: "error", message }
}

export async function createGuestPass(
  _state: GuestPassActionState,
  formData: FormData
): Promise<GuestPassActionState> {
  const active = await requireActiveMember()
  if (active.membership.role === "guard") return errorState("Guards cannot create guest passes.")

  const parsed = createSchema.safeParse({
    visitorName: formData.get("visitorName"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil"),
    maxEntries: formData.get("maxEntries") || 1,
    visitorPhone: formData.get("visitorPhone") || undefined,
    vehiclePlate: formData.get("vehiclePlate") || undefined,
    purpose: formData.get("purpose") || undefined,
  })
  if (!parsed.success) return errorState("Check the visitor details and validity window.")

  const validFrom = new Date(parsed.data.validFrom)
  const validUntil = new Date(parsed.data.validUntil)
  if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime()) || validUntil <= validFrom) {
    return errorState("The visit window must end after it starts.")
  }

  const secrets = createGuestPassSecrets()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_visitor_pass", {
    p_token_hash: hashToByteaInput(secrets.tokenHash),
    p_short_code_hash: hashToByteaInput(secrets.shortCodeHash),
    p_visitor_name: parsed.data.visitorName,
    p_valid_from: validFrom.toISOString(),
    p_valid_until: validUntil.toISOString(),
    p_max_entries: parsed.data.maxEntries,
    p_visitor_phone: parsed.data.visitorPhone || undefined,
    p_vehicle_plate: parsed.data.vehiclePlate || undefined,
    p_purpose: parsed.data.purpose || undefined,
  })

  if (error) {
    if (error.message.includes("too_many_active_passes")) return errorState("You already have the maximum active guest passes.")
    if (error.message.includes("pass_creation_rate_limited")) return errorState("You have reached today's guest-pass creation limit.")
    if (error.message.includes("valid_from_too_far")) return errorState("Start date is too far ahead.")
    if (error.message.includes("validity_too_long")) return errorState("Pass validity cannot exceed seven days.")
    return errorState("The guest pass could not be created.")
  }

  const passId = (data as { pass_id?: string } | null)?.pass_id
  if (!passId) return errorState("The guest pass could not be created.")

  revalidatePath("/guests")
  return {
    status: "success",
    message: "Guest pass created.",
    passId,
    token: secrets.token,
    shortCode: secrets.shortCode,
  }
}

export async function revokeGuestPass(
  _state: GuestPassActionState,
  formData: FormData
): Promise<GuestPassActionState> {
  const parsed = revokeSchema.safeParse({ passId: formData.get("passId") })
  if (!parsed.success) return errorState("That guest pass is not available.")
  await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("revoke_visitor_pass", { p_pass_id: parsed.data.passId })
  if (error) return errorState("The guest pass could not be revoked.")
  revalidatePath("/guests")
  return { status: "success", message: "Guest pass revoked." }
}

export async function setGuestPassCheckoutMute(
  _state: GuestPassActionState,
  formData: FormData
): Promise<GuestPassActionState> {
  const parsed = muteSchema.safeParse({ passId: formData.get("passId"), mute: formData.get("mute") })
  if (!parsed.success) return errorState("That preference could not be saved.")
  await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_guest_pass_checkout_mute", {
    p_pass_id: parsed.data.passId,
    p_mute: parsed.data.mute === "true",
  })
  if (error) return errorState("That preference could not be saved.")
  revalidatePath("/guests")
  return { status: "success", message: "Checkout notifications updated." }
}

export async function resolveGuestPass(
  token: string,
  shortCode?: string
): Promise<{ valid: boolean; reason?: string; data?: unknown }> {
  const normalizedToken = token.trim()
  const normalizedCode = shortCode?.trim().toUpperCase() || null
  if (!normalizedToken && !normalizedCode) return { valid: false, reason: "invalid" }

  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown"
  const subjectHash = hashToByteaInput(sha256Hex(ip))

  const supabase = await createClient()
  const attempt = await supabase.rpc("record_guest_access_attempt", {
    p_scope: normalizedToken ? "token_lookup" : "short_code",
    p_subject_hash: subjectHash,
    p_max_attempts: normalizedToken ? 60 : 5,
    p_window_seconds: 60,
  })
  if (attempt.error) return { valid: false, reason: "invalid" }
  const allowed = (attempt.data as { allowed?: boolean } | null)?.allowed
  if (!allowed) return { valid: false, reason: "rate_limited" }

  const { data, error } = await supabase.rpc("resolve_guest_pass", {
    p_token: normalizedToken || undefined,
    p_short_code: normalizedCode || undefined,
  })
  if (error || !data) return { valid: false, reason: "invalid" }
  return { valid: Boolean((data as { valid?: boolean }).valid), data }
}

export async function duplicateGuestPass(
  _state: GuestPassActionState,
  formData: FormData
): Promise<GuestPassActionState> {
  const parsed = revokeSchema.safeParse({ passId: formData.get("passId") })
  if (!parsed.success) return errorState("That guest pass is not available.")
  const active = await requireActiveMember()
  const supabase = await createClient()
  const source = await supabase
    .from("visitor_passes")
    .select("visitor_name,visitor_phone,vehicle_plate,purpose,max_entries")
    .eq("id", parsed.data.passId)
    .eq("host_id", active.user.id)
    .maybeSingle()
  if (source.error || !source.data) return errorState("That guest pass is not available.")

  const now = new Date()
  const until = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const sourcePhone = source.data.visitor_phone
  const sourcePlate = source.data.vehicle_plate
  const sourcePurpose = source.data.purpose
  const next = await createGuestPass(_state, (() => {
    const fd = new FormData()
    fd.set("visitorName", source.data.visitor_name ?? "Guest visitor")
    fd.set("validFrom", now.toISOString())
    fd.set("validUntil", until.toISOString())
    fd.set("maxEntries", String(source.data.max_entries))
    if (sourcePhone) fd.set("visitorPhone", sourcePhone)
    if (sourcePlate) fd.set("vehiclePlate", sourcePlate)
    if (sourcePurpose) fd.set("purpose", sourcePurpose)
    return fd
  })())
  return next
}
