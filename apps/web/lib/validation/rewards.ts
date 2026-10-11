import { z } from "zod"

export const redeemSchema = z.object({
  rewardId: z.uuid({ error: "Reward not found." }),
})

export const markRedemptionSchema = z.object({
  code: z.string().trim().min(8, { error: "Enter the 8-character voucher code." }).max(8),
})
