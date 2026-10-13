"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import {
  giveawayClaimSchema,
  giveawayFormSchema,
  giveawayTransitionSchema,
} from "@/lib/validation/giveaway"

export type GiveawayActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
  giveawayId?: string
}

function giveawayErrorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase()
  if (message.includes("giveaway_listing_limit")) {
    return "You already have five active giveaway listings. Complete or withdraw one first."
  }
  if (message.includes("giveaway_claim_limit")) {
    return "You already have an open giveaway claim. Confirm or cancel it before taking another."
  }
  if (message.includes("giveaway_not_available")) {
    return "That giveaway is no longer available."
  }
  if (message.includes("cannot_claim_own_giveaway")) {
    return "You cannot take your own giveaway."
  }
  if (message.includes("transition_not_allowed")) {
    return "That action is not available for this giveaway."
  }
  if (message.includes("not_active_member")) {
    return "Your township membership must be active to use Giveaway."
  }
  return "The giveaway could not be updated. Try again."
}

export async function createGiveaway(
  _state: GiveawayActionState,
  formData: FormData
): Promise<GiveawayActionState> {
  const parsed = giveawayFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categorySlug: formData.get("categorySlug"),
    condition: formData.get("condition") || "unusable",
    handoverLocation: formData.get("handoverLocation"),
    handoverNotes: formData.get("handoverNotes"),
    photoPath: formData.get("photoPath"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    }
  }

  const active = await requireActiveMember()
  const supabase = await createClient()

  let categoryId: string | null = null
  if (parsed.data.categorySlug) {
    const category = await supabase
      .from("item_categories")
      .select("id")
      .eq("slug", parsed.data.categorySlug)
      .maybeSingle()

    if (category.error || !category.data) {
      return {
        status: "error",
        fieldErrors: { categorySlug: ["Choose a valid category."] },
        message: "Choose a valid category.",
      }
    }
    categoryId = category.data.id
  }

  const { data, error } = await supabase.rpc("create_giveaway", {
    p_payload: {
      township_id: active.townshipId,
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: categoryId,
      condition: parsed.data.condition,
      handover_location: parsed.data.handoverLocation,
      handover_notes: parsed.data.handoverNotes,
      photo_path: parsed.data.photoPath,
    },
  })

  if (error) return { status: "error", message: giveawayErrorMessage(error) }

  const result = data as { giveaway_id?: string }
  revalidatePath("/giveaway")
  revalidatePath("/giveaway/mine")
  return {
    status: "success",
    message: "Your giveaway is now visible to the community.",
    giveawayId: result.giveaway_id,
  }
}

export async function claimGiveaway(
  _state: GiveawayActionState,
  formData: FormData
): Promise<GiveawayActionState> {
  const parsed = giveawayClaimSchema.safeParse({
    giveawayId: formData.get("giveawayId"),
  })
  if (!parsed.success)
    return { status: "error", message: "That giveaway is no longer available." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("claim_giveaway", {
    p_giveaway_id: parsed.data.giveawayId,
  })

  if (error) return { status: "error", message: giveawayErrorMessage(error) }

  const result = data as { giveaway_id?: string }
  revalidatePath("/giveaway")
  revalidatePath("/giveaway/mine")
  return {
    status: "success",
    message:
      "Claimed. Meet the giver in the shared handover spot and both confirm to earn BP.",
    giveawayId: result.giveaway_id,
  }
}

export async function transitionGiveaway(
  _state: GiveawayActionState,
  formData: FormData
): Promise<GiveawayActionState> {
  const parsed = giveawayTransitionSchema.safeParse({
    giveawayId: formData.get("giveawayId"),
    action: formData.get("action"),
    note: formData.get("note") || undefined,
  })
  if (!parsed.success)
    return { status: "error", message: "That action is not available." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("transition_giveaway", {
    p_giveaway_id: parsed.data.giveawayId,
    p_action: parsed.data.action,
    p_payload: parsed.data.note ? { note: parsed.data.note } : {},
  })

  if (error) return { status: "error", message: giveawayErrorMessage(error) }

  const result = data as {
    status?: string
    giver_points?: { delta?: number } | null
    taker_points?: { delta?: number } | null
  }

  revalidatePath("/giveaway")
  revalidatePath("/giveaway/mine")
  revalidatePath("/home")

  if (result.status === "completed") {
    return {
      status: "success",
      message:
        "Giveaway completed. The giver and taker each earn 3 BP when the daily reward limit allows.",
      giveawayId: parsed.data.giveawayId,
    }
  }

  return {
    status: "success",
    message:
      result.status === "active"
        ? "The claim was cancelled and the giveaway is available again."
        : "Giveaway updated.",
    giveawayId: parsed.data.giveawayId,
  }
}
