"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { sponsorChallengeSchema, sponsorRewardSchema } from "@/lib/validation/sponsor"

export type SponsorActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createPartnerReward(
  _state: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const parsed = sponsorRewardSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    costBp: formData.get("costBp"),
    stock: formData.get("stock"),
    imagePath: formData.get("imagePath") || undefined,
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the reward fields." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("create_partner_reward", {
    p_payload: {
      title: parsed.data.title,
      description: parsed.data.description,
      cost_bp: parsed.data.costBp,
      stock: parsed.data.stock,
      kind: "voucher",
      image_path: parsed.data.imagePath ?? null,
    },
  })
  if (error) return { status: "error", message: "Only a signed-in partner can create rewards." }

  revalidatePath("/sponsor/portal")
  return { status: "success", message: "Sponsor reward created." }
}

export async function createPartnerChallenge(
  _state: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const parsed = sponsorChallengeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    target: formData.get("target"),
    rewardPoints: formData.get("rewardPoints"),
    endsAt: formData.get("endsAt"),
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the challenge fields." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("create_partner_challenge", {
    p_payload: {
      title: parsed.data.title,
      description: parsed.data.description,
      target: parsed.data.target,
      reward_points: parsed.data.rewardPoints,
      starts_at: new Date().toISOString(),
      ends_at: new Date(`${parsed.data.endsAt}T23:59:59`).toISOString(),
      action_types: ["event_attendance"],
      scope: "individual",
    },
  })
  if (error) return { status: "error", message: "Only a signed-in partner can create challenges." }

  revalidatePath("/sponsor/portal")
  return { status: "success", message: "Sponsor challenge created." }
}
