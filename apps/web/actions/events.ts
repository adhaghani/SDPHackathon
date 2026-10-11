"use server"

import { SignJWT } from "jose"
import { revalidatePath } from "next/cache"

import { eventFormSchema, checkInSchema, rsvpSchema, volunteerHoursSchema } from "@/lib/validation/events"
import { getSecretKey } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { requireActiveMember } from "@/lib/data"

export type EventActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
  eventId?: string
  points?: number | null
}

function errorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase()
  if (message.includes("not_active_member")) return "Join the township first."
  if (message.includes("event_not_available")) return "That event is not available."
  if (message.includes("event_in_past")) return "Choose a future start time."
  if (message.includes("not_event_staff")) return "Only event staff can check people in."
  if (message.includes("cannot_self_check_in")) return "Staff cannot check themselves in."
  if (message.includes("outside_check_in_window")) return "Check-in is outside the allowed window."
  if (message.includes("rsvp_not_eligible")) return "That registration is not eligible for check-in."
  return "The request could not be completed. Try again."
}

export async function createEvent(
  _state: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const parsed = eventFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categorySlug: formData.get("categorySlug"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    locationText: formData.get("locationText"),
    capacity: formData.get("capacity") || undefined,
    volunteerSlots: formData.get("volunteerSlots") || undefined,
    accessibilityTags: formData.getAll("accessibilityTags").map(String),
    languages: formData.getAll("languages").map(String),
  })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    }
  }

  try {
    const active = await requireActiveMember()
    const supabase = await createClient()
    const category = await supabase
      .from("event_categories")
      .select("id")
      .eq("slug", parsed.data.categorySlug)
      .single()

    if (category.error || !category.data) {
      return { status: "error", message: "Choose a valid category." }
    }

    const { data, error } = await supabase.rpc("create_event", {
      p_payload: {
        township_id: active.townshipId,
        title: parsed.data.title,
        description: parsed.data.description,
        category_id: category.data.id,
        starts_at: new Date(parsed.data.startsAt).toISOString(),
        ends_at: new Date(parsed.data.endsAt).toISOString(),
        location_text: parsed.data.locationText,
        capacity: parsed.data.capacity ?? null,
        volunteer_slots: parsed.data.volunteerSlots ?? null,
        accessibility_tags: parsed.data.accessibilityTags,
        languages: parsed.data.languages,
      },
    })

    if (error) return { status: "error", message: errorMessage(error) }
    const result = data as { event_id?: string; status?: string }
    revalidatePath("/events")
    revalidatePath("/home")
    return {
      status: "success",
      message:
        result.status === "pending_approval"
          ? "Event submitted for approval."
          : "Event published.",
      eventId: result.event_id,
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : errorMessage({ message: "" }),
    }
  }
}

export async function rsvpEvent(
  _state: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const parsed = rsvpSchema.safeParse({
    eventId: formData.get("eventId"),
    role: formData.get("role") || "attendee",
  })
  if (!parsed.success) return { status: "error", message: "That event is not available." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("rsvp_event", {
    p_event_id: parsed.data.eventId,
    p_role: parsed.data.role,
  })
  if (error) return { status: "error", message: errorMessage(error) }

  const rsvp = data as { status?: string }
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath("/events")
  return {
    status: "success",
    message: rsvp.status === "waitlisted" ? "You are on the waitlist." : "You are going.",
    eventId: parsed.data.eventId,
  }
}

export async function cancelRsvp(
  _state: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const eventId = formData.get("eventId")
  if (typeof eventId !== "string") return { status: "error", message: "Event not found." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("cancel_rsvp", { p_event_id: eventId })
  if (error) return { status: "error", message: errorMessage(error) }
  revalidatePath(`/events/${eventId}`)
  revalidatePath("/events")
  return { status: "success", message: "Registration cancelled.", eventId }
}

export async function checkInRsvp(
  _state: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const parsed = checkInSchema.safeParse({
    rsvpId: formData.get("rsvpId"),
    method: formData.get("method") || "manual",
  })
  if (!parsed.success) return { status: "error", message: "Registration not found." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("check_in", {
    p_rsvp_id: parsed.data.rsvpId,
    p_method: parsed.data.method,
  })
  if (error) return { status: "error", message: errorMessage(error) }

  const result = data as { status?: string; display_name?: string; points?: { delta?: number } | null }
  revalidatePath("/events")
  revalidatePath("/home")
  return {
    status: "success",
    message:
      result.status === "already_checked_in"
        ? `${result.display_name ?? "Neighbour"} is already checked in.`
        : `${result.display_name ?? "Neighbour"} checked in.`,
    points: result.points?.delta ?? null,
  }
}

export async function completeEvent(
  _state: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const eventId = formData.get("eventId")
  if (typeof eventId !== "string") return { status: "error", message: "Event not found." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("complete_event", { p_event_id: eventId })
  if (error) return { status: "error", message: errorMessage(error) }

  revalidatePath(`/events/${eventId}`)
  revalidatePath("/events")
  revalidatePath("/home")
  return { status: "success", message: "Event completed.", eventId }
}

export async function verifyVolunteerHours(
  _state: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const parsed = volunteerHoursSchema.safeParse({
    rsvpId: formData.get("rsvpId"),
    hours: formData.get("hours"),
  })
  if (!parsed.success) {
    return { status: "error", message: "Enter between 0.5 and 4 volunteer hours." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("verify_volunteer_hours", {
    p_rsvp_id: parsed.data.rsvpId,
    p_hours: parsed.data.hours,
  })
  if (error) return { status: "error", message: errorMessage(error) }

  revalidatePath("/events")
  revalidatePath("/rewards")
  return { status: "success", message: "Volunteer hours verified." }
}

export async function signEventTicket(formData: FormData): Promise<string> {
  const eventId = formData.get("eventId")
  if (typeof eventId !== "string") throw new Error("Event not found.")
  const active = await requireActiveMember()
  const supabase = await createClient()
  const rsvp = await supabase
    .from("event_rsvps")
    .select("id,event_id,user_id,status")
    .eq("event_id", eventId)
    .eq("user_id", active.user.id)
    .single()

  if (rsvp.error || !rsvp.data) throw new Error("Registration not found.")

  const secret = new TextEncoder().encode(getSecretKey())
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    typ: "ticket",
    rsvp: rsvp.data.id,
    evt: eventId,
    usr: active.user.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 90)
    .sign(secret)
}

