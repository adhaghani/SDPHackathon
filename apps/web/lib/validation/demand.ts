import { z } from "zod"

export const itemRequestSchema = z.object({
  title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(100),
  categorySlug: z.string().trim().default(""),
  neededFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  neededUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  note: z.string().trim().max(600).default(""),
  alertOptIn: z.boolean().default(false),
}).refine(
  (value) => !value.neededFrom || !value.neededUntil || value.neededUntil >= value.neededFrom,
  { error: "The end date must be on or after the start date.", path: ["neededUntil"] }
)

export const itemOfferSchema = z.object({
  requestId: z.uuid({ error: "Request not found." }),
  itemId: z.uuid().optional().or(z.literal("")),
  message: z.string().trim().max(600).default(""),
})

export const acceptOfferSchema = z.object({
  offerId: z.uuid({ error: "Offer not found." }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((value) => value.endDate >= value.startDate, {
  error: "The end date must be on or after the start date.",
  path: ["endDate"],
})

export const bundleBookingSchema = z.object({
  bundleId: z.uuid({ error: "Bundle not found." }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  handoverMethod: z.string().trim().min(3).max(160),
}).refine((value) => value.endDate >= value.startDate, {
  error: "The end date must be on or after the start date.",
  path: ["endDate"],
})
