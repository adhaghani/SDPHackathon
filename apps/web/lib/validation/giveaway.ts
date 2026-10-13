import { z } from "zod"

export const giveawayFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "Use at least 3 characters." })
    .max(120, { error: "Use 120 characters or fewer." }),
  description: z
    .string()
    .trim()
    .max(1000, { error: "Use 1,000 characters or fewer." })
    .default(""),
  categorySlug: z.string().trim().max(100).default(""),
  condition: z.enum(["unusable", "worn", "good"]).default("unusable"),
  handoverLocation: z
    .string()
    .trim()
    .min(3, { error: "Choose a shared handover spot." })
    .max(160, { error: "Use 160 characters or fewer." })
    .default("Shared township space"),
  handoverNotes: z
    .string()
    .trim()
    .max(600, { error: "Use 600 characters or fewer." })
    .default(""),
  photoPath: z.string().trim().max(2048).default("/demo/item-placeholder.svg"),
})

export const giveawayClaimSchema = z.object({
  giveawayId: z.uuid({ error: "Giveaway not found." }),
})

export const giveawayTransitionSchema = z.object({
  giveawayId: z.uuid({ error: "Giveaway not found." }),
  action: z.enum(["confirm_handover", "cancel_claim", "withdraw"]),
  note: z.string().trim().max(600).optional(),
})
