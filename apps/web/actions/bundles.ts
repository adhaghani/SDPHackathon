"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { bundleBookingSchema } from "@/lib/validation/demand"
import { bundleFormSchema } from "@/lib/validation/demand"
import { bundleEditSchema } from "@/lib/validation/demand"

export type BundleActionState = {
  status: "idle" | "error" | "success"
  message?: string
}

export async function bookBundle(
  _state: BundleActionState,
  formData: FormData
): Promise<BundleActionState> {
  const parsed = bundleBookingSchema.safeParse({
    bundleId: formData.get("bundleId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    handoverMethod: formData.get("handoverMethod"),
  })
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the bundle dates.",
    }
  }

  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_bundle_booking", {
    p_bundle_id: parsed.data.bundleId,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
    p_handover_method: parsed.data.handoverMethod,
  })
  if (error) {
    return {
      status: "error",
      message: error.message.includes("dates_unavailable")
        ? "Those dates are unavailable for at least one bundle item."
        : "The bundle could not be booked.",
    }
  }

  revalidatePath("/borrow")
  const result = data as { booking_group_id?: string; booking_ids?: string[] }
  const firstBooking = result.booking_ids?.[0]
  if (firstBooking) redirect(`/borrow/bookings/${firstBooking}`)
  return { status: "success", message: "Bundle requested." }
}

export async function createBundle(
  _state: BundleActionState,
  formData: FormData
): Promise<BundleActionState> {
  const parsed = bundleFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    itemIds: formData.getAll("itemIds").map(String).filter(Boolean),
  })
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the bundle fields." }

  const active = await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_bundle", {
    p_payload: {
      township_id: active.townshipId,
      title: parsed.data.title,
      description: parsed.data.description,
      item_ids: parsed.data.itemIds,
    },
  })
  if (error) return { status: "error", message: "Choose two or more of your active items." }

  revalidatePath("/borrow")
  revalidatePath("/borrow/mine")
  const result = data as { bundle_id?: string }
  if (result.bundle_id) redirect(`/borrow/bundles/${result.bundle_id}`)
  return { status: "success", message: "Bundle created." }
}

export async function updateBundle(
  _state: BundleActionState,
  formData: FormData
): Promise<BundleActionState> {
  const parsed = bundleEditSchema.safeParse({
    bundleId: formData.get("bundleId"),
    title: formData.get("title"),
    description: formData.get("description") || "",
    itemIds: formData.getAll("itemIds").map(String).filter(Boolean),
  })
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the bundle fields." }

  await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("update_bundle", {
    p_bundle_id: parsed.data.bundleId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_item_ids: parsed.data.itemIds,
  })
  if (error) return { status: "error", message: "Choose two or more of your active items." }

  revalidatePath(`/borrow/bundles/${parsed.data.bundleId}`)
  revalidatePath("/borrow/mine")
  return { status: "success", message: "Bundle updated." }
}

export async function deleteBundle(
  _state: BundleActionState,
  formData: FormData
): Promise<BundleActionState> {
  const bundleId = formData.get("bundleId")
  if (typeof bundleId !== "string") return { status: "error", message: "Bundle not found." }
  await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("delete_bundle", { p_bundle_id: bundleId })
  if (error) return { status: "error", message: "Only the bundle owner can delete it." }
  revalidatePath("/borrow/mine")
  redirect("/borrow/mine")
}
