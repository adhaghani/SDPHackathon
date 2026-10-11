"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { markRedemptionSchema, redeemSchema } from "@/lib/validation/rewards"

export type RewardsActionState = {
  status: "idle" | "error" | "success"
  message?: string
  code?: string
}

function rewardErrorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase()
  if (message.includes("insufficient_balance")) return "You do not have enough BetterPoints for this reward."
  if (message.includes("per_user_limit")) return "You have already redeemed the maximum for this reward."
  if (message.includes("reward_unavailable")) return "That reward is not available right now."
  if (message.includes("redemption_not_available")) return "That voucher is already used or expired."
  if (message.includes("admin_required")) return "Only the township office can mark a voucher used."
  return "The reward request could not be completed. Try again."
}

export async function redeemReward(
  _state: RewardsActionState,
  formData: FormData
): Promise<RewardsActionState> {
  const parsed = redeemSchema.safeParse({ rewardId: formData.get("rewardId") })
  if (!parsed.success) return { status: "error", message: "That reward is not available." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("redeem_reward", {
    p_reward_id: parsed.data.rewardId,
  })
  if (error) return { status: "error", message: rewardErrorMessage(error) }

  const result = data as { code?: string }
  revalidatePath("/rewards")
  revalidatePath("/home")
  return { status: "success", message: "Voucher issued.", code: result.code }
}

export async function markRedemptionUsed(
  _state: RewardsActionState,
  formData: FormData
): Promise<RewardsActionState> {
  const parsed = markRedemptionSchema.safeParse({ code: formData.get("code") })
  if (!parsed.success) return { status: "error", message: "Enter the 8-character voucher code." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("mark_redemption_used", {
    p_code: parsed.data.code,
  })
  if (error) return { status: "error", message: rewardErrorMessage(error) }

  revalidatePath("/admin")
  return { status: "success", message: "Voucher marked used." }
}
