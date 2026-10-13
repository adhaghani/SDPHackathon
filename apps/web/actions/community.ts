"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import {
  announcementSchema,
  groupActionSchema,
  helpActionSchema,
  helpRequestSchema,
} from "@/lib/validation/community"

export type CommunityActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function communityErrorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase()
  if (message.includes("not_allowed")) return "Only organisers and the township office can post announcements."
  if (message.includes("help_request_unavailable")) return "That helping request is no longer available."
  if (message.includes("not_active_member")) return "Join the township first."
  return "The request could not be completed. Try again."
}

export async function createAnnouncement(
  _state: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    pinned: formData.get("pinned") === "on",
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the announcement fields." }
  }

  const active = await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("create_announcement", {
    p_payload: {
      township_id: active.townshipId,
      title: parsed.data.title,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
    },
  })
  if (error) return { status: "error", message: communityErrorMessage(error) }
  revalidatePath("/community")
  return { status: "success", message: "Announcement posted." }
}

export async function createHelpRequest(
  _state: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const parsed = helpRequestSchema.safeParse({
    title: formData.get("title"),
    details: formData.get("details"),
    kind: formData.get("kind") || "other",
    neededBy: formData.get("neededBy") || undefined,
    recurrence: formData.get("recurrence") || "none",
    recurrenceIntervalDays: formData.get("recurrenceIntervalDays") || undefined,
    recurrenceUntil: formData.get("recurrenceUntil") || undefined,
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the helping request fields." }
  }

  const active = await requireActiveMember()
  const supabase = await createClient()
  const occurrences = parsed.data.recurrence === "none"
    ? 1
    : Math.min(8, Math.max(1, Math.ceil(
      (new Date(parsed.data.recurrenceUntil as string).getTime() - new Date().getTime()) /
      ((parsed.data.recurrence === "weekly" ? 7 : 30) * 24 * 60 * 60 * 1000)
    )))
  let firstRequestId: string | undefined
  for (let index = 0; index < occurrences; index += 1) {
    const neededBy = parsed.data.neededBy
      ? new Date(`${parsed.data.neededBy}T12:00:00+08:00`)
      : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    if (index > 0) {
      if (parsed.data.recurrence === "weekly") neededBy.setDate(neededBy.getDate() + (parsed.data.recurrenceIntervalDays ?? 7) * index)
      else neededBy.setMonth(neededBy.getMonth() + index)
    }
    const { data, error } = await supabase.rpc("create_help_request", {
      p_payload: {
      township_id: active.townshipId,
      title: occurrences > 1 ? `${parsed.data.title} · ${index + 1}` : parsed.data.title,
      details: parsed.data.details,
      kind: parsed.data.kind,
      needed_by: neededBy.toISOString().slice(0, 10),
      recurrence: parsed.data.recurrence,
      recurrence_interval_days: parsed.data.recurrenceIntervalDays ?? (parsed.data.recurrence === "weekly" ? 7 : 30),
      recurrence_until: parsed.data.recurrenceUntil ?? null,
      },
    })
    if (error) return { status: "error", message: communityErrorMessage(error) }
    const result = data as { request_id?: string }
    firstRequestId ??= result.request_id
  }
  revalidatePath("/community")
  return { status: "success", message: occurrences > 1 ? `Created ${occurrences} recurring helping requests.` : "Helping request posted." }
}

export async function acceptHelpRequest(
  _state: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const parsed = helpActionSchema.safeParse({ requestId: formData.get("requestId") })
  if (!parsed.success) return { status: "error", message: "That helping request is not available." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("accept_help_request", { p_request_id: parsed.data.requestId })
  if (error) return { status: "error", message: communityErrorMessage(error) }
  revalidatePath("/community")
  return { status: "success", message: "You offered to help." }
}

export async function completeHelpRequest(
  _state: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const parsed = helpActionSchema.safeParse({ requestId: formData.get("requestId") })
  if (!parsed.success) return { status: "error", message: "That helping request is not available." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("complete_help_request", { p_request_id: parsed.data.requestId })
  if (error) return { status: "error", message: communityErrorMessage(error) }
  revalidatePath("/community")
  return { status: "success", message: "Helping request completed." }
}

export async function toggleGroup(
  _state: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const parsed = groupActionSchema.safeParse({ groupId: formData.get("groupId") })
  if (!parsed.success) return { status: "error", message: "That group is not available." }
  const supabase = await createClient()
  const existing = await supabase.from("group_members").select("group_id").eq("group_id", parsed.data.groupId).maybeSingle()
  const { error } = await supabase.rpc(
    existing.data ? "leave_group" : "join_group",
    { p_group_id: parsed.data.groupId }
  )
  if (error) return { status: "error", message: communityErrorMessage(error) }
  revalidatePath("/community")
  return { status: "success", message: existing.data ? "You left the group." : "You joined the group." }
}
