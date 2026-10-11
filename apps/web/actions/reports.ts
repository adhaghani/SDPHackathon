"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { reportSchema } from "@/lib/validation/reports"

export type ReportActionState = {
  status: "idle" | "error" | "success"
  message?: string
}

export async function submitReport(
  _state: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  const parsed = reportSchema.safeParse({
    townshipId: formData.get("townshipId"),
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  })
  if (!parsed.success) return { status: "error", message: "Check the report fields." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("create_report", {
    p_payload: {
      township_id: parsed.data.townshipId,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  })
  if (error) return { status: "error", message: "The report could not be submitted. Try again." }

  revalidatePath("/community")
  return { status: "success", message: "Report submitted. The township office will review it." }
}

export async function blockUserAction(
  _state: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  const blockedId = formData.get("blockedId")
  if (typeof blockedId !== "string") return { status: "error", message: "That resident cannot be blocked." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("block_user", { p_blocked_id: blockedId })
  if (error) return { status: "error", message: "That resident cannot be blocked." }

  revalidatePath("/borrow/mine")
  return { status: "success", message: "Resident blocked. Their content and bookings are hidden from you." }
}
