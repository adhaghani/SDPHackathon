"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = formData.get("id")
  if (typeof id !== "string") return
  const supabase = await createClient()
  await supabase.rpc("mark_notification_read", { p_notification_id: id })
  revalidatePath("/notifications")
  revalidatePath("/home")
}
