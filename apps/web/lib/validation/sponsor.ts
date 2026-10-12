import { z } from "zod"

export const sponsorRewardSchema = z.object({
  title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(120),
  description: z.string().trim().max(600).default(""),
  costBp: z.coerce.number().int().min(1).max(10000),
  stock: z.coerce.number().int().min(1).max(1000),
  imagePath: z.string().trim().max(500).optional(),
})

export const sponsorChallengeSchema = z.object({
  title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(120),
  description: z.string().trim().max(600).default(""),
  target: z.coerce.number().int().min(1).max(100000),
  rewardPoints: z.coerce.number().int().min(0).max(10000),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose an end date." }),
})
