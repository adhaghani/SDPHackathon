"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import {
  acceptOfferSchema,
  attachOfferItemSchema,
  itemOfferSchema,
  itemRequestSchema,
} from "@/lib/validation/demand"

export type RequestActionState = {
  status: "idle" | "error" | "success"
  message?: string
  requestId?: string
  bookingId?: string
}

export async function postItemRequest(
  _state: RequestActionState,
  formData: FormData
): Promise<RequestActionState> {
  const parsed = itemRequestSchema.safeParse({
    title: formData.get("title"),
    categorySlug: formData.get("categorySlug") || "",
    neededFrom: formData.get("neededFrom") || "",
    neededUntil: formData.get("neededUntil") || "",
    note: formData.get("note") || "",
    alertOptIn: formData.get("alertOptIn") === "on",
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the request fields.",
    }
  }

  const active = await requireActiveMember()
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
    if (!categoryId) return { status: "error", message: "Choose a valid category." }
  }

  const { data, error } = await supabase.rpc("create_item_request", {
    p_payload: {
      township_id: active.townshipId,
      title: parsed.data.title,
      category_id: categoryId,
      neighbourhood_id: active.membership?.neighbourhood_id,
      needed_from: parsed.data.neededFrom || null,
      needed_until: parsed.data.neededUntil || null,
      note: parsed.data.note,
    },
  })
  if (error) {
    return {
      status: "error",
      message: error.message.includes("open_request_limit")
        ? "You can keep up to three open requests."
        : "The request could not be posted.",
    }
  }

  if (parsed.data.alertOptIn && categoryId) {
    const { error: alertError } = await supabase.from("item_request_alert_opt_ins").upsert(
      {
        user_id: active.user.id,
        township_id: active.townshipId,
        category_id: categoryId,
      },
      { onConflict: "user_id,township_id,category_id" }
    )
    if (alertError) throw new Error(alertError.message)
  }

  const result = data as { request_id?: string }
  revalidatePath("/borrow/requests")
  revalidatePath("/borrow")
  return {
    status: "success",
    message: "Request posted. Matching neighbours have been notified.",
    requestId: result.request_id,
  }
}

export async function offerItemRequest(
  _state: RequestActionState,
  formData: FormData
): Promise<RequestActionState> {
  const parsed = itemOfferSchema.safeParse({
    requestId: formData.get("requestId"),
    itemId: formData.get("itemId") || "",
    message: formData.get("message") || "",
  })
  if (!parsed.success) return { status: "error", message: "That offer is not available." }

  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("offer_item_request", {
    p_request_id: parsed.data.requestId,
    p_item_id: parsed.data.itemId || undefined,
    p_message: parsed.data.message,
  })
  if (error) {
    return {
      status: "error",
      message: error.message.includes("category_mismatch")
        ? "Choose an item in the requested category."
        : "That request is no longer open.",
    }
  }

  revalidatePath("/borrow/requests")
  const result = data as { offer_id?: string }
  return { status: "success", message: "Offer sent to the requester.", requestId: result.offer_id }
}

export async function acceptItemOffer(
  _state: RequestActionState,
  formData: FormData
): Promise<RequestActionState> {
  const parsed = acceptOfferSchema.safeParse({
    offerId: formData.get("offerId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  })
  if (!parsed.success) return { status: "error", message: "That offer is not available." }

  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("accept_item_request_offer", {
    p_offer_id: parsed.data.offerId,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
  })
  if (error) return { status: "error", message: "The offer could not be accepted." }

  revalidatePath("/borrow/requests")
  const result = data as { booking_id?: string }
  redirect(result.booking_id ? `/borrow/bookings/${result.booking_id}` : "/borrow/requests")
}

export async function attachItemToOffer(
  _state: RequestActionState,
  formData: FormData
): Promise<RequestActionState> {
  const parsed = attachOfferItemSchema.safeParse({
    offerId: formData.get("offerId"),
    itemId: formData.get("itemId"),
  })
  if (!parsed.success) return { status: "error", message: "Choose an item to attach." }

  await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("attach_item_to_offer", {
    p_offer_id: parsed.data.offerId,
    p_item_id: parsed.data.itemId,
  })
  if (error) return { status: "error", message: "That item cannot be attached to this offer." }

  revalidatePath("/borrow/requests")
  return { status: "success", message: "Item attached. The requester can now accept the offer." }
}
