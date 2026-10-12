"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { bundleBookingSchema } from "@/lib/validation/demand"

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
