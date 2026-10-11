"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  memberActionSchema,
  moderationSchema,
  programmeCostSchema,
  reversePointsSchema,
} from "@/lib/validation/admin"

export type AdminActionState = {
  status: "idle" | "error" | "success"
  message?: string
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
