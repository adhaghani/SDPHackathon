"use server"

import { revalidatePath, updateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { referenceCacheTag } from "@/lib/supabase/reference-fetch"
import { requireActiveMember } from "@/lib/data"
import { badgeCriteriaSchema } from "@/lib/validation/badges"
import type { Json } from "@/types/database"
import {
  memberActionSchema,
  moderationSchema,
  programmeCostSchema,
  resolveDisputeSchema,
  reversePointsSchema,
  badgeSchema,
  carbonGoalSchema,
  highlightSchema,
  carbonFactorSchema,
  calendarVerificationSchema,
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
  if (!parsed.success)
    return { status: "error", message: "Check the badge fields." }

  let criteria: Json | undefined
  const rawCriteria = formData.get("criteria")
  if (typeof rawCriteria === "string" && rawCriteria) {
    try {
      const rule = badgeCriteriaSchema.safeParse(JSON.parse(rawCriteria))
      if (!rule.success)
        return {
          status: "error",
          message:
            rule.error.issues[0]?.message ?? "Check the earning requirements.",
        }
      criteria = rule.data as Json
    } catch {
      return { status: "error", message: "Check the earning requirements." }
    }
  }

  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin")
    return {
      status: "error",
      message: "Only the township office can manage awards.",
    }
  const supabase = await createClient()
  const { error } = await supabase.rpc("save_badge_definition", {
    p_slug: parsed.data.slug,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_icon: parsed.data.icon,
    ...(criteria === undefined ? {} : { p_criteria: criteria }),
  })
  if (error)
    return { status: "error", message: "The award could not be saved." }

  updateTag(referenceCacheTag("badges"))
  revalidatePath("/admin/badges")
  revalidatePath("/rewards")
  revalidatePath("/profile")
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
  if (!parsed.success)
    return { status: "error", message: "That member action is not available." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("approve_member", {
    p_member_id: parsed.data.memberId,
    p_approve: parsed.data.approve === "approve",
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can approve members.",
    }

  revalidatePath("/admin/members")
  return {
    status: "success",
    message:
      parsed.data.approve === "approve"
        ? "Member approved."
        : "Member rejected.",
  }
}

export async function moderationAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = moderationSchema.safeParse({
    reportId: formData.get("reportId"),
    action: formData.get("action"),
  })
  if (!parsed.success)
    return {
      status: "error",
      message: "That moderation action is not available.",
    }

  const supabase = await createClient()
  const { error } = await supabase.rpc("moderate_report", {
    p_report_id: parsed.data.reportId,
    p_action: parsed.data.action,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can moderate reports.",
    }

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
  if (!parsed.success)
    return { status: "error", message: "Check the programme cost fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("save_programme_cost", {
    p_month: parsed.data.month,
    p_label: parsed.data.label,
    p_amount_rm: parsed.data.amountRm,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can save programme costs.",
    }

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
  if (!parsed.success)
    return { status: "error", message: "Check the reversal fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("reverse_points", {
    p_ledger_id: parsed.data.ledgerId,
    p_reason: parsed.data.reason,
  })
  if (error)
    return {
      status: "error",
      message:
        "Only positive ledger rows can be reversed by the township office.",
    }

  revalidatePath("/admin/rewards")
  revalidatePath("/rewards")
  return {
    status: "success",
    message: "Points reversal recorded with an audit entry.",
  }
}

export async function resolveDisputeAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = resolveDisputeSchema.safeParse({
    disputeId: formData.get("disputeId"),
    resolution: formData.get("resolution"),
    note: formData.get("note"),
    borrowerAtFault: formData.get("borrowerAtFault") === "on",
  })
  if (!parsed.success)
    return { status: "error", message: "Check the dispute resolution fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("resolve_booking_dispute", {
    p_dispute_id: parsed.data.disputeId,
    p_resolution: parsed.data.resolution,
    p_note: parsed.data.note,
    p_borrower_at_fault: parsed.data.borrowerAtFault,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can resolve disputes.",
    }

  revalidatePath("/admin/disputes")
  revalidatePath("/borrow/mine")
  return { status: "success", message: "Dispute resolved." }
}

export async function approveHighlightAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = highlightSchema.safeParse({
    monthStart: formData.get("monthStart"),
    residentId: formData.get("residentId"),
    reason: formData.get("reason"),
  })
  if (!parsed.success)
    return { status: "error", message: "Check the highlight fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("approve_monthly_highlight", {
    p_month_start: parsed.data.monthStart,
    p_resident_id: parsed.data.residentId,
    p_reason: parsed.data.reason,
  })
  if (error)
    return {
      status: "error",
      message: "Only organisers can approve a highlight.",
    }

  revalidatePath("/admin/engagement")
  revalidatePath("/home")
  return { status: "success", message: "Neighbour of the month approved." }
}

export async function saveCarbonGoalAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = carbonGoalSchema.safeParse({
    year: formData.get("year"),
    targetKg: formData.get("targetKg"),
  })
  if (!parsed.success)
    return { status: "error", message: "Check the carbon goal values." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_township_goal", {
    p_year: parsed.data.year,
    p_target_co2e_kg: parsed.data.targetKg,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can set a goal.",
    }

  revalidatePath("/admin/engagement")
  revalidatePath("/home")
  return { status: "success", message: "Carbon goal saved." }
}

export async function saveCarbonFactorAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = carbonFactorSchema.safeParse({
    categorySlug: formData.get("categorySlug"),
    factorKg: formData.get("factorKg"),
    source: formData.get("source"),
  })
  if (!parsed.success)
    return { status: "error", message: "Check the CO₂e factor fields." }

  const supabase = await createClient()
  const active = await requireActiveMember()
  const { error } = await supabase.rpc("set_item_category_co2e", {
    p_slug: parsed.data.categorySlug,
    p_factor: parsed.data.factorKg,
    p_source: parsed.data.source,
    p_township_id: active.townshipId,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can save CO₂e factors.",
    }

  revalidatePath("/admin/engagement")
  revalidatePath("/home")
  return { status: "success", message: "CO₂e factor saved." }
}

export async function verifyCalendarEventAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const parsed = calendarVerificationSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status") || "verified",
    note: formData.get("note") || "",
  })
  if (!parsed.success)
    return { status: "error", message: "That calendar date is not available." }

  const supabase = await createClient()
  const active = await requireActiveMember()
  const { error } = await supabase.rpc("set_calendar_event_verification", {
    p_event_id: parsed.data.eventId,
    p_status: parsed.data.status,
    p_note: parsed.data.note,
    p_township_id: active.townshipId,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can verify calendar dates.",
    }

  revalidatePath("/admin/demand")
  return {
    status: "success",
    message:
      parsed.data.status === "verified"
        ? "Calendar date verified."
        : "Calendar date rejected.",
  }
}

export async function resolveSupportTicketAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const ticketId = formData.get("ticketId")
  const status = formData.get("status")
  if (
    typeof ticketId !== "string" ||
    !["open", "in_progress", "resolved"].includes(String(status))
  ) {
    return { status: "error", message: "That support ticket is not available." }
  }
  const validatedStatus = String(status) as "open" | "in_progress" | "resolved"

  const supabase = await createClient()
  const { error } = await supabase.rpc("resolve_support_ticket", {
    p_ticket_id: ticketId,
    p_status: validatedStatus,
  })
  if (error)
    return {
      status: "error",
      message: "Only the township office can update support tickets.",
    }

  revalidatePath("/admin/support")
  return { status: "success", message: "Support ticket updated." }
}
