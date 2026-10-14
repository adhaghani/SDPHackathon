"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import {
  recyclingCampaignSchema,
  recyclingFactorSchema,
  recyclingLogSchema,
} from "@/lib/validation/recycling"

export type RecyclingActionState = {
  status: "idle" | "error" | "success"
  message?: string
  logId?: string
  totalKg?: number
}

export type RecyclingAdminActionState = {
  status: "idle" | "error" | "success"
  message?: string
}

function recyclingErrorMessage(error: { message: string }) {
  const message = error.message.toLowerCase()
  if (message.includes("daily_limit")) return "You have reached the 100 kg daily estimate limit."
  if (message.includes("invalid_unit") || message.includes("invalid_material")) return "That recyclable item is not available."
  if (message.includes("invalid_quantity") || message.includes("invalid_custom_kg")) return "Check the quantity or estimated weight."
  if (message.includes("invalid_date")) return "Choose a valid, non-future date."
  if (message.includes("not_active_member")) return "Your township membership must be active to log recycling."
  if (message.includes("active_campaign_exists")) return "End or update the current campaign before creating another."
  if (message.includes("campaign_locked")) return "A completed campaign cannot be edited."
  if (message.includes("admin_required")) return "Only the township office can update recycling settings."
  return "The recycling estimate could not be saved. Try again."
}

export async function logRecyclingAction(
  _state: RecyclingActionState,
  formData: FormData
): Promise<RecyclingActionState> {
  let lines: unknown
  try {
    lines = JSON.parse(String(formData.get("lines") || "[]"))
  } catch {
    return { status: "error", message: "Check the recyclable items you selected." }
  }

  const parsed = recyclingLogSchema.safeParse({
    townshipId: formData.get("townshipId"),
    method: formData.get("method"),
    occurredOn: formData.get("occurredOn"),
    photoPaths: formData.getAll("photoPaths").map(String).filter(Boolean),
    lines,
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the recycling estimate.",
    }
  }

  const active = await requireActiveMember()
  if (parsed.data.townshipId !== active.townshipId) {
    return { status: "error", message: "That township is not available." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("log_recycling", {
    p_payload: {
      township_id: parsed.data.townshipId,
      method: parsed.data.method,
      occurred_on: parsed.data.occurredOn,
      photo_paths: parsed.data.photoPaths,
      lines: parsed.data.lines.map((line) =>
        line.kind === "count"
          ? { unit_id: line.unitId, quantity: line.quantity }
          : { material_id: line.materialId, kg: line.kg }
      ),
    },
  })
  if (error) return { status: "error", message: recyclingErrorMessage(error) }

  const result = data as { log_id?: string; total_kg?: number }
  revalidatePath("/recycling")
  revalidatePath("/home")
  revalidatePath("/rewards")
  return {
    status: "success",
    message: "Estimate saved. Your impact totals are updated.",
    logId: result.log_id,
    totalKg: Number(result.total_kg ?? 0),
  }
}

export async function saveRecyclingCampaignAction(
  _state: RecyclingAdminActionState,
  formData: FormData
): Promise<RecyclingAdminActionState> {
  const parsed = recyclingCampaignSchema.safeParse({
    campaignId: formData.get("campaignId") || undefined,
    townshipId: formData.get("townshipId"),
    title: formData.get("title"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
    targetKg: formData.get("targetKg"),
    status: formData.get("status") || "active",
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the campaign fields.",
    }
  }
  if (parsed.data.endsOn < parsed.data.startsOn) {
    return { status: "error", message: "The end date must be on or after the start date." }
  }

  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") {
    return { status: "error", message: "Only the township office can set a recycling campaign." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_recycling_campaign", {
    p_payload: {
      campaign_id: parsed.data.campaignId ?? null,
      township_id: active.townshipId,
      title: parsed.data.title,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      target_kg: parsed.data.targetKg,
      status: parsed.data.status,
    },
  })
  if (error) return { status: "error", message: recyclingErrorMessage(error) }

  revalidatePath("/admin/engagement")
  revalidatePath("/home")
  return { status: "success", message: "Recycling campaign saved." }
}

export async function saveRecyclingFactorAction(
  _state: RecyclingAdminActionState,
  formData: FormData
): Promise<RecyclingAdminActionState> {
  const parsed = recyclingFactorSchema.safeParse({
    townshipId: formData.get("townshipId"),
    slug: formData.get("slug"),
    co2eKgPerKg: formData.get("co2eKgPerKg"),
    energyKwhPerKg: formData.get("energyKwhPerKg"),
    source: formData.get("source"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the factor fields.",
    }
  }

  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") {
    return { status: "error", message: "Only the township office can update impact factors." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_recycling_material_factor", {
    p_slug: parsed.data.slug,
    p_co2e_kg_per_kg: parsed.data.co2eKgPerKg,
    p_energy_kwh_per_kg: parsed.data.energyKwhPerKg,
    p_source: parsed.data.source,
    p_township_id: active.townshipId,
  })
  if (error) return { status: "error", message: recyclingErrorMessage(error) }

  revalidatePath("/admin/engagement")
  revalidatePath("/recycling")
  revalidatePath("/home")
  return { status: "success", message: "Recycling impact factors saved." }
}
