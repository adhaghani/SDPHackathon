"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { requireActiveMember } from "@/lib/data"
import { hashToByteaInput, sha256Hex } from "@/lib/guest-pass-token"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export type GuestGuardState = {
  status: "idle" | "error" | "success"
  message?: string
  data?: unknown
}

const resolveSchema = z.object({
  token: z.string().max(512).optional(),
  shortCode: z.string().max(16).optional(),
  plate: z.string().max(24).optional(),
  passId: z.uuid().optional(),
  townshipId: z.uuid(),
})

const scanSchema = z.object({
  direction: z.enum(["in", "out"]),
  gateId: z.uuid(),
  idSighted: z.enum(["true", "false"]).default("false"),
  note: z.string().max(300).optional(),
  scannedAt: z.string().datetime({ offset: true }),
  clientEventId: z.uuid(),
  token: z.string().max(512).optional(),
  shortCode: z.string().max(16).optional(),
  plate: z.string().max(24).optional(),
  passId: z.uuid().optional(),
  townshipId: z.uuid(),
})

const walkInSchema = z.object({
  gateId: z.uuid(),
  hostMemberId: z.uuid(),
  visitorName: z.string().trim().min(1).max(100),
  vehiclePlate: z.string().trim().max(24).optional(),
  clientRequestId: z.uuid(),
  townshipId: z.uuid(),
})

const respondSchema = z.object({
  requestId: z.uuid(),
  approve: z.enum(["true", "false"]),
  note: z.string().max(300).optional(),
})

function error(message: string): GuestGuardState {
  return { status: "error", message }
}

async function guardContext() {
  const active = await requireActiveMember()
  if (active.membership.role !== "guard") return null
  return active
}

function friendlyReason(reason?: string): string {
  switch (reason) {
    case "invalid": return "That pass is invalid."
    case "wrong_township": return "That pass belongs to another township."
    case "revoked": return "This pass has been revoked."
    case "expired": return "This pass has expired."
    case "not_started": return "This pass has not started yet."
    case "entries_used_up": return "This pass has used all entries."
    case "already_inside": return "This visitor is already inside."
    case "not_inside": return "This visitor is not inside."
    case "not_approved": return "The host has not approved this walk-in."
    case "denied": return "The host denied this walk-in."
    case "rate_limited": return "Too many attempts. Wait a moment and try again."
    default: return "The pass could not be validated."
  }
}

export async function getGuestPassCache(): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Only guards can load the gate cache.")
  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("get_guard_pass_cache", {
    p_township_id: active.townshipId,
  })
  if (rpcError) return error("Today's pass cache could not be loaded.")
  return { status: "success", data: data ?? [] }
}

export async function resolveGuardGuest(input: z.infer<typeof resolveSchema>): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  const parsed = resolveSchema.safeParse(input)
  if (!parsed.success) return error("Enter a valid pass code or plate.")

  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown"
  const subjectHash = hashToByteaInput(sha256Hex(`guard:${active.user.id}:${ip}`))

  const supabase = await createClient()
  const attempt = await supabase.rpc("record_guest_access_attempt", {
    p_scope: parsed.data.shortCode ? "short_code" : "token_lookup",
    p_subject_hash: subjectHash,
    p_max_attempts: parsed.data.shortCode ? 5 : 60,
    p_window_seconds: 60,
  })
  if (attempt.error) return error("Validation is temporarily unavailable.")
  if (!(attempt.data as { allowed?: boolean })?.allowed) return error(friendlyReason("rate_limited"))

  const { data, error: rpcError } = await supabase.rpc("get_guard_guest_result", {
    p_token: parsed.data.token || undefined,
    p_short_code: parsed.data.shortCode || undefined,
    p_plate: parsed.data.plate || undefined,
    p_pass_id: parsed.data.passId || undefined,
    p_township_id: parsed.data.townshipId,
  })
  if (rpcError || !data) return error("The pass could not be validated.")
  const result = data as { valid?: boolean; reason?: string }
  if (!result.valid) return error(friendlyReason(result.reason))
  return { status: "success", data }
}

export async function recordGuardGuestScan(input: z.infer<typeof scanSchema>): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  const parsed = scanSchema.safeParse(input)
  if (!parsed.success) return error("The scan details are incomplete.")
  if (parsed.data.townshipId !== active.townshipId) return error("That scan belongs to another township.")

  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("record_guest_scan", {
    p_direction: parsed.data.direction,
    p_gate_id: parsed.data.gateId,
    p_id_sighted: parsed.data.idSighted === "true",
    p_note: parsed.data.note || undefined,
    p_device_scanned_at: new Date(parsed.data.scannedAt).toISOString(),
    p_client_event_id: parsed.data.clientEventId,
    p_token: parsed.data.token || undefined,
    p_short_code: parsed.data.shortCode || undefined,
    p_plate: parsed.data.plate || undefined,
    p_pass_id: parsed.data.passId || undefined,
    p_township_id: parsed.data.townshipId,
  })

  if (rpcError || !data) return error("The scan could not be recorded.")
  const result = data as { valid?: boolean; reason?: string; duplicate?: boolean }
  if (!result.valid) return error(friendlyReason(result.reason))
  revalidatePath("/guard")
  return {
    status: "success",
    message: result.duplicate ? "This scan was already recorded." : parsed.data.direction === "in" ? "Visitor checked in." : "Visitor checked out.",
    data,
  }
}

export async function getGuardGuestLists(): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("get_guard_guest_lists", {
    p_township_id: active.townshipId,
  })
  if (rpcError) return error("Inside and log lists could not be loaded.")
  return { status: "success", data: data ?? { inside: [], logs: [] } }
}

export async function lookupWalkInHosts(unitLabel: string): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  if (!unitLabel.trim()) return { status: "success", data: [] }
  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("lookup_walk_in_hosts", {
    p_township_id: active.townshipId,
    p_unit_label: unitLabel.trim(),
  })
  if (rpcError) return error("Host lookup is unavailable.")
  return { status: "success", data: data ?? [] }
}

export async function createWalkIn(input: z.infer<typeof walkInSchema>): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  const parsed = walkInSchema.safeParse(input)
  if (!parsed.success) return error("Enter the visitor's name and choose a host.")
  if (parsed.data.townshipId !== active.townshipId) return error("That request belongs to another township.")

  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("create_walk_in_request", {
    p_gate_id: parsed.data.gateId,
    p_host_member_id: parsed.data.hostMemberId,
    p_visitor_name: parsed.data.visitorName,
    p_vehicle_plate: parsed.data.vehiclePlate || undefined,
    p_client_request_id: parsed.data.clientRequestId,
    p_township_id: parsed.data.townshipId,
  })
  if (rpcError || !data) return error("The walk-in request could not be sent.")
  revalidatePath("/guard")
  return { status: "success", message: "Approval request sent to the host.", data }
}

export async function respondWalkIn(input: z.infer<typeof respondSchema>): Promise<GuestGuardState> {
  const active = await requireActiveMember()
  if (active.membership.role === "guard") return error("Guards cannot approve walk-ins.")
  const parsed = respondSchema.safeParse(input)
  if (!parsed.success) return error("That walk-in request is not available.")

  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("respond_to_walk_in", {
    p_request_id: parsed.data.requestId,
    p_approve: parsed.data.approve === "true",
    p_note: parsed.data.note || undefined,
  })
  if (rpcError || !data) return error("The walk-in response could not be saved.")
  revalidatePath("/guard")
  return { status: "success", message: parsed.data.approve === "true" ? "Walk-in approved." : "Walk-in denied.", data }
}

export async function recordWalkInScan(input: {
  direction: "in" | "out"
  gateId: string
  walkInRequestId: string
  idSighted?: boolean
  scannedAt?: string
  clientEventId?: string
  townshipId: string
}): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  if (input.townshipId !== active.townshipId) return error("That scan belongs to another township.")
  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("record_walk_in_scan", {
    p_direction: input.direction,
    p_gate_id: input.gateId,
    p_walk_in_request_id: input.walkInRequestId,
    p_id_sighted: input.idSighted ?? false,
    p_device_scanned_at: input.scannedAt ?? new Date().toISOString(),
    p_client_event_id: input.clientEventId ?? crypto.randomUUID(),
    p_township_id: input.townshipId,
  })
  if (rpcError || !data) return error("The walk-in scan could not be recorded.")
  const result = data as { valid?: boolean; reason?: string; duplicate?: boolean }
  if (!result.valid) return error(friendlyReason(result.reason))
  revalidatePath("/guard")
  return { status: "success", message: result.duplicate ? "This scan was already recorded." : input.direction === "in" ? "Walk-in checked in." : "Walk-in checked out.", data }
}


export async function getGuardWalkIns(includeClosed = false): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("get_guard_walk_ins", {
    p_township_id: active.townshipId,
    p_include_closed: includeClosed,
  })
  if (rpcError) return error("Walk-in requests could not be loaded.")
  return { status: "success", data: data ?? [] }
}

export type QueuedGuestScan = {
  clientEventId: string
  direction: "in" | "out"
  gateId: string
  passId: string
  token?: string
  scannedAt: string
  idSighted: boolean
  note?: string
  townshipId: string
}

export async function syncQueuedGuestScan(scan: QueuedGuestScan): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  if (scan.townshipId !== active.townshipId) return error("Queued scan belongs to another township.")

  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("sync_guest_scan", {
    p_direction: scan.direction,
    p_gate_id: scan.gateId,
    p_pass_id: scan.passId,
    p_id_sighted: scan.idSighted,
    p_note: scan.note || undefined,
    p_device_scanned_at: scan.scannedAt,
    p_client_event_id: scan.clientEventId,
    p_token: scan.token || undefined,
    p_township_id: scan.townshipId,
  })

  if (rpcError || !data) return error("The offline scan could not be synchronized.")
  const result = data as { duplicate?: boolean; sync_status?: string; applied?: boolean; review_reason?: string }
  return {
    status: "success",
    message: result.duplicate
      ? "This scan was already synchronized."
      : result.sync_status === "needs_review"
        ? "Saved for review because the pass changed while offline."
        : "Offline scan synchronized.",
    data,
  }
}

export async function markWalkInManual(
  requestId: string,
  note?: string
): Promise<GuestGuardState> {
  const active = await guardContext()
  if (!active) return error("Guard access required.")
  const supabase = await createClient()
  const { data, error: rpcError } = await supabase.rpc("mark_walk_in_manual", {
    p_request_id: requestId,
    p_note: note || undefined,
    p_township_id: active.townshipId,
  })
  if (rpcError || !data) return error("The manual follow-up could not be recorded.")
  revalidatePath("/guard")
  return { status: "success", message: "Manual follow-up recorded.", data }
}
