"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import {
  bookingRequestSchema,
  bookingMessageSchema,
  bookingTransitionSchema,
  itemFormSchema,
} from "@/lib/validation/borrow"

export type BorrowActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
  itemId?: string
  bookingId?: string
  points?: number | null
}

function borrowErrorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase()
  if (message.includes("cannot_book_own_item")) return "You cannot borrow your own item."
  if (message.includes("dates_unavailable")) return "Those dates are already booked."
  if (message.includes("loan_too_long")) return "Choose a shorter loan window."
  if (message.includes("item_not_available")) return "That item is not available."
  if (message.includes("transition_not_allowed")) return "That action is not available for this booking."
  return "The request could not be completed. Try again."
}

export async function createItem(
  _state: BorrowActionState,
  formData: FormData
): Promise<BorrowActionState> {
  const parsed = itemFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categorySlug: formData.get("categorySlug"),
    condition: formData.get("condition"),
    estimatedNewPriceRm: formData.get("estimatedNewPriceRm") || undefined,
    depositRm: formData.get("depositRm") || 0,
    maxLoanDays: formData.get("maxLoanDays"),
    handoverOptions: formData.getAll("handoverOptions").map(String),
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
  const category = await supabase
    .from("item_categories")
    .select("id")
    .eq("slug", parsed.data.categorySlug)
    .single()
  if (category.error || !category.data) return { status: "error", message: "Choose a valid category." }

  const { data, error } = await supabase.rpc("create_item", {
    p_payload: {
      township_id: active.townshipId,
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: category.data.id,
      condition: parsed.data.condition,
      photo_paths: ["/demo/item-placeholder.svg"],
      estimated_new_price_rm: parsed.data.estimatedNewPriceRm ?? null,
      deposit_rm: parsed.data.depositRm,
      max_loan_days: parsed.data.maxLoanDays,
      handover_options: parsed.data.handoverOptions,
    },
  })
  if (error) return { status: "error", message: borrowErrorMessage(error) }

  const result = data as { item_id?: string }
  revalidatePath("/borrow")
  revalidatePath("/borrow/mine")
  return { status: "success", message: "Item listed.", itemId: result.item_id }
}

export async function requestBooking(
  _state: BorrowActionState,
  formData: FormData
): Promise<BorrowActionState> {
  const parsed = bookingRequestSchema.safeParse({
    itemId: formData.get("itemId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    handoverMethod: formData.get("handoverMethod"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the dates and handover option.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_booking", {
    p_item_id: parsed.data.itemId,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
    p_handover_method: parsed.data.handoverMethod,
  })
  if (error) return { status: "error", message: borrowErrorMessage(error) }

  const result = data as { booking_id?: string }
  revalidatePath("/borrow")
  revalidatePath("/borrow/mine")
  return { status: "success", message: "Request sent.", bookingId: result.booking_id }
}

export async function transitionBooking(
  _state: BorrowActionState,
  formData: FormData
): Promise<BorrowActionState> {
  const parsed = bookingTransitionSchema.safeParse({
    bookingId: formData.get("bookingId"),
    action: formData.get("action"),
    wouldHaveBought: formData.get("wouldHaveBought") || undefined,
    handoverNote: formData.get("handoverNote") || undefined,
    returnNote: formData.get("returnNote") || undefined,
  })
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "That action is not available.",
    }
  }

  const supabase = await createClient()
  if (parsed.data.action === "open_dispute") {
    const { error } = await supabase.rpc("open_booking_dispute", {
      p_booking_id: parsed.data.bookingId,
      p_reason: "booking_issue",
      p_details: parsed.data.handoverNote ?? "",
    })
    if (error) return { status: "error", message: borrowErrorMessage(error) }
    revalidatePath(`/borrow/bookings/${parsed.data.bookingId}`)
    revalidatePath("/borrow/mine")
    return { status: "success", message: "Issue reported. The township office will review it.", bookingId: parsed.data.bookingId }
  }

  const { data, error } = await supabase.rpc("transition_booking", {
    p_booking_id: parsed.data.bookingId,
    p_action: parsed.data.action,
    p_payload: {
      ...(parsed.data.wouldHaveBought ? { would_have_bought: parsed.data.wouldHaveBought } : {}),
      ...(parsed.data.handoverNote ? { handover_note: parsed.data.handoverNote } : {}),
      ...(parsed.data.returnNote ? { return_note: parsed.data.returnNote } : {}),
    },
  })
  if (error) return { status: "error", message: borrowErrorMessage(error) }

  const result = data as { status?: string; lender_points?: { delta?: number } | null }
  revalidatePath(`/borrow/bookings/${parsed.data.bookingId}`)
  revalidatePath("/borrow/mine")
  revalidatePath("/home")
  return {
    status: "success",
    message:
      result.status === "completed"
        ? "Return confirmed. BetterPoints awarded to the lender."
        : "Booking updated.",
    bookingId: parsed.data.bookingId,
    points: result.lender_points?.delta ?? null,
  }
}

export async function sendBookingMessage(
  _state: BorrowActionState,
  formData: FormData
): Promise<BorrowActionState> {
  const parsed = bookingMessageSchema.safeParse({
    bookingId: formData.get("bookingId"),
    body: formData.get("body"),
  })
  if (!parsed.success) {
    return { status: "error", message: "Write a short message before sending." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("send_booking_message", {
    p_booking_id: parsed.data.bookingId,
    p_body: parsed.data.body,
  })
  if (error) return { status: "error", message: "Only the two booking participants can use this chat." }

  revalidatePath(`/borrow/bookings/${parsed.data.bookingId}`)
  return { status: "success", message: "Message sent." }
}
