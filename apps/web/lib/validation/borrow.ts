import { z } from "zod"

export const itemFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { error: "Use at least 3 characters." })
      .max(100),
    description: z.string().trim().max(1200).default(""),
    guideBody: z.string().trim().max(1000).default(""),
    guideSafetyNote: z.string().trim().max(600).default(""),
    categorySlug: z.string().min(1, { error: "Choose a category." }),
    kind: z.enum(["item", "skill"]).default("item"),
    condition: z.enum(["like_new", "good", "fair"]),
    estimatedNewPriceRm: z.coerce.number().min(0).max(100000).optional(),
    valueSource: z
      .enum(["owner", "suggested", "category_default"])
      .default("category_default"),
    requiresDeposit: z.boolean().default(false),
    depositRm: z.coerce.number().min(0).max(100000).default(0),
    allowDepositWaiver: z.boolean().default(false),
    minTrustTier: z
      .enum(["building", "trusted", "highly_trusted"])
      .optional()
      .or(z.literal("")),
    maxLoanDays: z.coerce.number().int().min(1).max(30),
    handoverOptions: z
      .array(z.string())
      .min(1, { error: "Choose a handover option." }),
    photoPath: z.string().trim().max(2048).optional(),
    durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
    meetingFacilityId: z.uuid().optional().or(z.literal("")),
    meetingArrangement: z
      .enum(["arranged_by_message", "shared_facility"])
      .default("arranged_by_message"),
    guardianAcknowledgement: z.boolean().default(false),
  })
  .refine((value) => !value.requiresDeposit || value.depositRm > 0, {
    error: "Set a deposit greater than zero or turn deposits off.",
    path: ["depositRm"],
  })

export const borrowSearchSchema = z.object({
  q: z.string().trim().max(100).default(""),
  category: z.string().trim().max(100).default(""),
  free: z.enum(["true", "false"]).default("false"),
  nl: z.string().trim().max(500).default(""),
})

export const bookingRequestSchema = z
  .object({
    itemId: z.uuid({ error: "Item not found." }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a start date." }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose an end date." }),
    handoverMethod: z
      .string()
      .trim()
      .min(3, { error: "Choose a handover option." })
      .max(160),
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
    "contest_condition",
  ]),
  wouldHaveBought: z.enum(["yes", "no", "unsure"]).optional(),
  handoverNote: z.string().trim().max(600).optional(),
  returnNote: z.string().trim().max(600).optional(),
  guideAcknowledged: z.boolean().default(false),
  returnCondition: z
    .enum(["like_new", "good", "fair", "damaged"])
    .default("good"),
  returnConditionReason: z.string().trim().max(600).default(""),
})

export const itemGuideSchema = z.object({
  itemId: z.uuid({ error: "Item not found." }),
  body: z.string().trim().min(1, { error: "Write a short how-to." }).max(1000),
  safetyNote: z.string().trim().max(600).default(""),
  photoPaths: z.array(z.string().trim().max(2048)).max(3).default([]),
})

export const bookingMessageSchema = z.object({
  bookingId: z.uuid({ error: "Booking not found." }),
  body: z
    .string()
    .trim()
    .min(1, { error: "Write a message." })
    .max(1200, { error: "Use 1,200 characters or fewer." }),
})
