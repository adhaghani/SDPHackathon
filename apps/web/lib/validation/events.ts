import { z } from "zod"

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(100),
    description: z.string().trim().max(1200).default(""),
    categorySlug: z.string().min(1, { error: "Choose a category." }),
    startsAt: z.string().min(1, { error: "Choose a start time." }),
    endsAt: z.string().min(1, { error: "Choose an end time." }),
    locationText: z.string().trim().min(3, { error: "Add a shared location." }).max(160),
    coverPath: z.string().trim().max(500).optional(),
    capacity: z.coerce.number().int().positive().max(1000).optional(),
    volunteerSlots: z.coerce.number().int().min(0).max(100).optional(),
    accessibilityTags: z.array(z.string()).default([]),
    languages: z.array(z.string()).min(1, { error: "Choose at least one language." }),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    error: "End time must be after the start time.",
    path: ["endsAt"],
  })

export const rsvpSchema = z.object({
  eventId: z.uuid({ error: "Event not found." }),
  role: z.enum(["attendee", "volunteer"]),
})

export const checkInSchema = z.object({
  rsvpId: z.uuid({ error: "Registration not found." }),
  method: z.enum(["manual", "qr"]),
})

export const volunteerHoursSchema = z.object({
  rsvpId: z.uuid({ error: "Registration not found." }),
  hours: z.coerce.number().min(0.5, { error: "Enter at least 0.5 hours." }).max(4, { error: "Enter at most 4 hours." }),
})
