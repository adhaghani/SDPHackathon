"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export type DemandActionState = {
  status: "idle" | "error" | "success"
  message?: string
}

const wishlistSchema = z.object({
  categorySlug: z.string().trim().max(100),
  normalizedTerm: z.string().trim().max(100),
  label: z.string().trim().min(2).max(160),
})

export async function addWishlistAction(
  _state: DemandActionState,
  formData: FormData
): Promise<DemandActionState> {
  const parsed = wishlistSchema.safeParse({
    categorySlug: formData.get("categorySlug") || "",
    normalizedTerm: formData.get("normalizedTerm") || "",
    label: formData.get("label"),
  })
  if (!parsed.success) return { status: "error", message: "Check the wishlist label." }

  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") {
    return { status: "error", message: "Only the township office can update the shared wishlist." }
  }
  const supabase = await createClient()
  let categoryId: string | undefined
  if (parsed.data.categorySlug) {
    const category = await supabase
      .from("item_categories")
      .select("id")
      .eq("slug", parsed.data.categorySlug)
      .maybeSingle()
    if (category.error) throw new Error(category.error.message)
    categoryId = category.data?.id
  }

  const { error } = await supabase.rpc("add_shared_library_wishlist", {
    p_category_id: categoryId ?? undefined,
    p_normalized_term: parsed.data.normalizedTerm,
    p_label: parsed.data.label,
  })
  if (error) return { status: "error", message: "The wishlist item could not be saved." }

  revalidatePath("/admin/demand")
  return { status: "success", message: "Added to the shared library wishlist." }
}

export async function sendForecastNudgeAction(): Promise<{ status: "success" | "error"; count?: number }> {
  try {
    const active = await requireActiveMember()
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("send_forecast_nudges", {
      p_township_id: active.townshipId,
    })
    if (error) return { status: "error" }
    return { status: "success", count: Number(data ?? 0) }
  } catch {
    return { status: "error" }
  }
}
