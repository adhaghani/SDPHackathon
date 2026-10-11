"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type NotificationActionState = {
  status: "idle" | "success"
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = formData.get("id")
  if (typeof id !== "string") return
  const supabase = await createClient()
  await supabase.rpc("mark_notification_read", { p_notification_id: id })
  revalidatePath("/notifications")
  revalidatePath("/home")
}

export async function setNotificationPreference(
  _state: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const type = formData.get("type")
  const enabled = formData.get("enabled") === "on"
  if (typeof type !== "string") return { status: "idle" }
  const supabase = await createClient()
  await supabase.rpc("set_notification_preference", { p_type: type, p_enabled: enabled })
  revalidatePath("/profile/settings")
  return { status: "success" }
}
