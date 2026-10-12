"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireActiveMember } from "@/lib/data"
import {
  memberActionSchema,
  moderationSchema,
  programmeCostSchema,
  resolveDisputeSchema,
  reversePointsSchema,
  badgeSchema,
} from "@/lib/validation/admin"

export type AdminActionState = {
  status: "idle" | "error" | "success"
  message?: string
}

export async function saveBadge(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = badgeSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
  })
  if (!parsed.success) return { status: "error", message: "Check the badge fields." }

  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") return { status: "error", message: "Only the township office can manage awards." }
  const { getAdminClient } = await import("@/lib/supabase/admin")
  const admin = getAdminClient()
  const { error } = await admin.from("badges").upsert(
    {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon,
      criteria: { type: "count", action_types: ["event_attendance"], threshold: 1 },
    },
    { onConflict: "slug" }
  )
  if (error) return { status: "error", message: "The award could not be saved." }

  revalidatePath("/admin/badges")
  revalidatePath("/rewards")
  return { status: "success", message: "Award saved." }
}

export async function memberAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = memberActionSchema.safeParse({
    memberId: formData.get("memberId"),
    approve: formData.get("approve"),
  })
  if (!parsed.success) return { status: "error", message: "That member action is not available." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("approve_member", {
    p_member_id: parsed.data.memberId,
    p_approve: parsed.data.approve === "approve",
  })
  if (error) return { status: "error", message: "Only the township office can approve members." }

  revalidatePath("/admin/members")
  return { status: "success", message: parsed.data.approve === "approve" ? "Member approved." : "Member rejected." }
}

export async function moderationAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = moderationSchema.safeParse({
    reportId: formData.get("reportId"),
    action: formData.get("action"),
  })
  if (!parsed.success) return { status: "error", message: "That moderation action is not available." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("moderate_report", {
    p_report_id: parsed.data.reportId,
    p_action: parsed.data.action,
  })
  if (error) return { status: "error", message: "Only the township office can moderate reports." }

  revalidatePath("/admin/moderation")
  return { status: "success", message: "Report updated." }
}

export async function saveProgrammeCost(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = programmeCostSchema.safeParse({
    month: formData.get("month"),
    label: formData.get("label"),
    amountRm: formData.get("amountRm"),
  })
  if (!parsed.success) return { status: "error", message: "Check the programme cost fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("save_programme_cost", {
    p_month: parsed.data.month,
    p_label: parsed.data.label,
    p_amount_rm: parsed.data.amountRm,
  })
  if (error) return { status: "error", message: "Only the township office can save programme costs." }

  revalidatePath("/admin/budget")
  return { status: "success", message: "Programme cost saved." }
}

export async function reversePointsAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = reversePointsSchema.safeParse({
    ledgerId: formData.get("ledgerId"),
    reason: formData.get("reason"),
  })
  if (!parsed.success) return { status: "error", message: "Check the reversal fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("reverse_points", {
    p_ledger_id: parsed.data.ledgerId,
    p_reason: parsed.data.reason,
  })
  if (error) return { status: "error", message: "Only positive ledger rows can be reversed by the township office." }

  revalidatePath("/admin/rewards")
  revalidatePath("/rewards")
  return { status: "success", message: "Points reversal recorded with an audit entry." }
}

export async function resolveDisputeAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = resolveDisputeSchema.safeParse({
    disputeId: formData.get("disputeId"),
    resolution: formData.get("resolution"),
    note: formData.get("note"),
  })
  if (!parsed.success) return { status: "error", message: "Check the dispute resolution fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("resolve_booking_dispute", {
    p_dispute_id: parsed.data.disputeId,
    p_resolution: parsed.data.resolution,
    p_note: parsed.data.note,
  })
  if (error) return { status: "error", message: "Only the township office can resolve disputes." }

  revalidatePath("/admin/disputes")
  revalidatePath("/borrow/mine")
  return { status: "success", message: "Dispute resolved." }
}
