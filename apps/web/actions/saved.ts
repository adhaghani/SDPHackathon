"use server"

import { revalidatePath } from "next/cache"

import { getSavedItemIds, setSavedItemIds } from "@/lib/saved-items"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export type SavedItemActionState = {
  status: "idle" | "error" | "success"
  message?: string
  saved?: boolean
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function toggleSavedItem(
  itemId: string,
  save: boolean
): Promise<SavedItemActionState> {
  if (!UUID_PATTERN.test(itemId) || typeof save !== "boolean") {
    return { status: "error", message: "That item could not be saved." }
  }

  const active = await requireActiveMember()

  if (save) {
    const supabase = await createClient()
    const itemResult = await supabase
      .from("items")
      .select("id")
      .eq("id", itemId)
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .eq("hidden", false)
      .maybeSingle()

    if (itemResult.error)
      return { status: "error", message: "That item could not be saved." }
    if (!itemResult.data) {
      return { status: "error", message: "This item is no longer available." }
    }
  }

  const currentIds = await getSavedItemIds(active.user.id)
  const nextIds = save
    ? [itemId, ...currentIds.filter((id) => id !== itemId)]
    : currentIds.filter((id) => id !== itemId)

  await setSavedItemIds(active.user.id, nextIds)

  revalidatePath("/borrow")
  revalidatePath("/borrow/saved")
  revalidatePath("/home")
  revalidatePath(`/borrow/items/${itemId}`)

  return { status: "success", saved: nextIds.includes(itemId) }
}
