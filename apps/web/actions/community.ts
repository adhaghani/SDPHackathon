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
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the helping request fields." }
  }

  const active = await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("create_help_request", {
    p_payload: {
      township_id: active.townshipId,
      title: parsed.data.title,
      details: parsed.data.details,
      kind: parsed.data.kind,
      needed_by: parsed.data.neededBy ?? null,
    },
  })
  if (error) return { status: "error", message: communityErrorMessage(error) }
  revalidatePath("/community")
  return { status: "success", message: "Helping request posted." }
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
