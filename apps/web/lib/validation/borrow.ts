import { z } from "zod"

export const itemFormSchema = z.object({
  title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(100),
  description: z.string().trim().max(1200).default(""),
  categorySlug: z.string().min(1, { error: "Choose a category." }),
  condition: z.enum(["like_new", "good", "fair"]),
  estimatedNewPriceRm: z.coerce.number().min(0).max(100000).optional(),
  depositRm: z.coerce.number().min(0).max(100000).default(0),
  maxLoanDays: z.coerce.number().int().min(1).max(30),
  handoverOptions: z.array(z.string()).min(1, { error: "Choose a handover option." }),
  photoPath: z.string().trim().max(2048).optional(),
})

export const bookingRequestSchema = z
  .object({
    itemId: z.uuid({ error: "Item not found." }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a start date." }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose an end date." }),
    handoverMethod: z.string().trim().min(3, { error: "Choose a handover option." }).max(160),
  })
  .refine((value) => value.endDate >= value.startDate, {
    error: "End date must be on or after the start date.",
    path: ["endDate"],
  })

export const bookingTransitionSchema = z.object({
  bookingId: z.uuid({ error: "Booking not found." }),
  action: z.enum([
    "approve",
    "decline",
    "cancel",
    "confirm_handover",
    "mark_returned",
    "confirm_return",
    "open_dispute",
  ]),
  wouldHaveBought: z.enum(["yes", "no", "unsure"]).optional(),
  handoverNote: z.string().trim().max(600).optional(),
  returnNote: z.string().trim().max(600).optional(),
})

export const bookingMessageSchema = z.object({
  bookingId: z.uuid({ error: "Booking not found." }),
  body: z.string().trim().min(1, { error: "Write a message." }).max(1200, { error: "Use 1,200 characters or fewer." }),
})
