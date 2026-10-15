import { z } from "zod"

const threshold = z.number().int().min(1).max(10000)
export const badgeCriteriaSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("count"),
      threshold,
      action_types: z
        .array(z.string().regex(/^[a-z][a-z_]{1,79}$/))
        .min(1)
        .max(20),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough(),
  z
    .object({ type: z.literal("streak"), threshold: threshold.max(120) })
    .passthrough(),
  z
    .object({
      type: z.literal("consecutive_recent"),
      threshold,
      action_type: z.literal("item_returned_on_time"),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("sustained"),
      min_types: z.number().int().min(1).max(20),
      min_active_weeks: z.number().int().min(1).max(104),
      window_weeks: z.number().int().min(1).max(104),
    })
    .passthrough()
    .refine((value) => value.min_active_weeks <= value.window_weeks, {
      message: "Active weeks cannot exceed the time window.",
    }),
  z.object({ type: z.literal("manual") }).passthrough(),
])
