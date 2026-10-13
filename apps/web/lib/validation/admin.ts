import { z } from "zod"

export const memberActionSchema = z.object({
  memberId: z.uuid({ error: "Member not found." }),
  approve: z.enum(["approve", "reject"]),
})

export const moderationSchema = z.object({
  reportId: z.uuid({ error: "Report not found." }),
  action: z.enum(["dismiss", "hide", "actioned"]),
})

export const programmeCostSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a month." }),
  label: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(120),
  amountRm: z.coerce.number().min(0, { error: "Amount cannot be negative." }).max(1000000),
})

export const reversePointsSchema = z.object({
  ledgerId: z.uuid({ error: "Ledger row not found." }),
  reason: z.string().trim().min(3, { error: "Add a short reason." }).max(240),
})

export const resolveDisputeSchema = z.object({
  disputeId: z.uuid({ error: "Dispute not found." }),
  resolution: z.enum(["completed", "closed"]),
  note: z.string().trim().max(600).default(""),
  borrowerAtFault: z.boolean().default(false),
})

export const badgeSchema = z.object({
  slug: z.string().trim().min(3).max(80).regex(/^[a-z0-9-]+$/, { error: "Use lowercase letters, numbers and hyphens." }),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(240),
  icon: z.enum(["award", "hand-heart", "leaf", "recycle", "shield", "sparkles", "users-round"]),
})

export const highlightSchema = z.object({
  monthStart: z.string().regex(/^\d{4}-\d{2}-01$/),
  residentId: z.uuid(),
  reason: z.string().trim().min(3).max(160),
})

export const carbonGoalSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  targetKg: z.coerce.number().positive().max(1_000_000),
})

export const carbonFactorSchema = z.object({
  categorySlug: z.string().trim().min(1),
  factorKg: z.coerce.number().min(0).max(100000),
  source: z.string().trim().min(3).max(500),
})

export const calendarVerificationSchema = z.object({
  eventId: z.uuid(),
  status: z.enum(["needs_review", "verified", "rejected"]),
  note: z.string().trim().max(500).default(""),
})
