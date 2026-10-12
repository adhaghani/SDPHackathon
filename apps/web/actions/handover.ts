"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { getSecretKey } from "@/lib/env"
import { createHandoverToken, verifyHandoverToken } from "@/lib/handover-token"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export type HandoverActionState = {
  status: "idle" | "error" | "success"
  message?: string
  token?: string
  expiresAt?: string
  bookingId?: string
}

const issueSchema = z.object({
  bookingId: z.uuid(),
})

export async function issueHandoverToken(
  _state: HandoverActionState,
  formData: FormData
): Promise<HandoverActionState> {
  const parsed = issueSchema.safeParse({ bookingId: formData.get("bookingId") })
  if (!parsed.success) return { status: "error", message: "That booking cannot issue a handover code." }

  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("register_booking_handover_token", {
    p_booking_id: parsed.data.bookingId,
  })
  if (error) {
    return {
      status: "error",
      message: error.message.includes("not_allowed")
        ? "Only the lender can prepare a handover code for an approved booking."
        : "A fresh handover code could not be prepared.",
    }
  }
  const registration = data as { jti?: string; expires_at?: string }
  if (!registration.jti || !registration.expires_at) {
    return { status: "error", message: "A fresh handover code could not be prepared." }
  }

  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = Math.floor(new Date(registration.expires_at).getTime() / 1000)
  const token = createHandoverToken(
    {
      typ: "booking_handover",
      booking: parsed.data.bookingId,
      jti: registration.jti,
      iat: issuedAt,
      exp: expiresAt,
    },
    getSecretKey()
  )
  revalidatePath(`/borrow/bookings/${parsed.data.bookingId}`)
  return {
    status: "success",
    token,
    expiresAt: registration.expires_at,
    bookingId: parsed.data.bookingId,
    message: "Handover code ready. It expires in 30 minutes.",
  }
}

export async function syncHandoverScan(
  token: string,
  deviceScannedAt: string,
  guideAcknowledged = false
): Promise<HandoverActionState> {
  try {
    const payload = verifyHandoverToken(token, getSecretKey())
    const scannedAt = new Date(deviceScannedAt)
    if (Number.isNaN(scannedAt.getTime()) || scannedAt.getTime() > Date.now() + 2 * 60 * 1000) {
      return { status: "error", message: "The device timestamp is not valid." }
    }

    await requireActiveMember()
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("consume_booking_handover_token", {
      p_jti: payload.jti,
      p_booking_id: payload.booking,
      p_device_scanned_at: scannedAt.toISOString(),
      p_guide_acknowledged: guideAcknowledged,
    })
    if (error) {
      if (error.message.includes("replayed")) {
        return { status: "error", message: "That handover code was already used." }
      }
      if (error.message.includes("expired")) {
        return { status: "error", message: "That handover code has expired. Ask for a fresh one." }
      }
      if (error.message.includes("guide_ack")) {
        return { status: "error", message: "Read and acknowledge the item how-to before scanning." }
      }
      return { status: "error", message: "The handover scan could not be synchronized." }
    }

    const result = data as { booking_id?: string }
    revalidatePath(`/borrow/bookings/${payload.booking}`)
    revalidatePath("/borrow/mine")
    return {
      status: "success",
      bookingId: result.booking_id ?? payload.booking,
      message: "Handover synchronized. Both confirmations are recorded.",
    }
  } catch {
    return { status: "error", message: "That handover code is invalid or expired." }
  }
}
