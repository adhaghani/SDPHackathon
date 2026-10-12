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
})

export const badgeSchema = z.object({
  slug: z.string().trim().min(3).max(80).regex(/^[a-z0-9-]+$/, { error: "Use lowercase letters, numbers and hyphens." }),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(240),
  icon: z.enum(["award", "hand-heart", "leaf", "recycle", "shield", "sparkles", "users-round"]),
})
