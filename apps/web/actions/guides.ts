"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { itemGuideSchema } from "@/lib/validation/borrow"

export type GuideActionState = {
  status: "idle" | "error" | "success"
  message?: string
  points?: number | null
}

export async function saveItemGuide(
  _state: GuideActionState,
  formData: FormData
): Promise<GuideActionState> {
  const parsed = itemGuideSchema.safeParse({
    itemId: formData.get("itemId"),
    body: formData.get("body"),
    safetyNote: formData.get("safetyNote") || "",
    photoPaths: formData.getAll("photoPaths").map(String).filter(Boolean),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the guide fields.",
    }
  }

  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("save_item_guide", {
    p_item_id: parsed.data.itemId,
    p_body: parsed.data.body,
    p_safety_note: parsed.data.safetyNote,
    p_photo_paths: parsed.data.photoPaths,
  })
  if (error) {
    return {
      status: "error",
      message: error.message.includes("not_item_owner")
        ? "Only the item owner can edit its guide."
        : "The guide could not be saved. Check that the body is 1,000 characters or fewer.",
    }
  }

  const result = data as { points?: { delta?: number } | null; first_guide?: boolean }
  revalidatePath(`/borrow/items/${parsed.data.itemId}`)
  return {
    status: "success",
    message: result.first_guide
      ? "Guide saved. You earned 5 BP for your first guide on this item."
      : "Guide updated.",
    points: result.points?.delta ?? null,
  }
}
