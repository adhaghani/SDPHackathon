import { z } from "zod"

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const recyclingCountLineSchema = z.object({
  unitId: z.uuid({ error: "Choose a recyclable item." }),
  quantity: z.coerce
    .number({ error: "Enter a quantity." })
    .int({ error: "Use a whole number." })
    .min(1, { error: "Add at least one item." })
    .max(500, { error: "Use 500 items or fewer per line." }),
})

export const recyclingCustomLineSchema = z.object({
  materialId: z.uuid({ error: "Choose a material." }),
  kg: z.coerce
    .number({ error: "Enter an estimated weight." })
    .positive({ error: "Weight must be greater than zero." })
    .max(100, { error: "Use 100 kg or less per line." }),
})

export const recyclingLogSchema = z
  .object({
    townshipId: z.uuid({ error: "Township not found." }),
    method: z.enum(["count", "custom_kg"], { error: "Choose an estimate method." }),
    occurredOn: z
      .string()
      .regex(datePattern, { error: "Use a valid date." }),
    photoPaths: z
      .array(z.string().trim().min(10).max(2048))
      .max(3, { error: "Use three photos or fewer." })
      .default([]),
    lines: z
      .array(z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("count"), unitId: z.uuid(), quantity: z.number().int().min(1).max(500) }),
        z.object({ kind: z.literal("custom_kg"), materialId: z.uuid(), kg: z.number().positive().max(100) }),
      ]))
      .min(1, { error: "Add at least one estimate." })
      .max(20, { error: "Use 20 lines or fewer." }),
  })
  .superRefine((value, ctx) => {
    const currentDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" })
    if (value.occurredOn !== currentDate) {
      ctx.addIssue({
        code: "custom",
        message: "You can only log for today.",
        path: ["occurredOn"],
      })
    }
    if (value.method === "count" && value.lines.some((line) => line.kind !== "count")) {
      ctx.addIssue({
        code: "custom",
        message: "Count estimates only accept item quantities.",
        path: ["lines"],
      })
    }
    if (value.method === "custom_kg" && value.lines.some((line) => line.kind !== "custom_kg")) {
      ctx.addIssue({
        code: "custom",
        message: "Custom estimates only accept material weights.",
        path: ["lines"],
      })
    }
  })

export const recyclingCampaignSchema = z.object({
  campaignId: z.uuid().optional(),
  townshipId: z.uuid({ error: "Township not found." }),
  title: z
    .string()
    .trim()
    .min(3, { error: "Use at least 3 characters." })
    .max(120, { error: "Use 120 characters or fewer." }),
  startsOn: z.string().regex(datePattern, { error: "Choose a start date." }),
  endsOn: z.string().regex(datePattern, { error: "Choose an end date." }),
  targetKg: z.coerce
    .number({ error: "Enter a target." })
    .positive({ error: "Target must be greater than zero." })
    .max(1_000_000, { error: "Use a target of 1,000,000 kg or less." }),
  status: z.enum(["active", "cancelled"], { error: "Choose a valid status." }).default("active"),
})

export const recyclingFactorSchema = z.object({
  townshipId: z.uuid({ error: "Township not found." }),
  slug: z.string().trim().min(1, { error: "Choose a material." }),
  co2eKgPerKg: z.coerce
    .number({ error: "Enter a CO₂e factor." })
    .min(0, { error: "Factor cannot be negative." })
    .max(100_000, { error: "Factor is too large." }),
  energyKwhPerKg: z.coerce
    .number({ error: "Enter an energy factor." })
    .min(0, { error: "Factor cannot be negative." })
    .max(100_000, { error: "Factor is too large." }),
  source: z
    .string()
    .trim()
    .min(3, { error: "Add a cited source." })
    .max(500, { error: "Use 500 characters or fewer." }),
})

export function parseRecyclingLogLines(value: unknown) {
  return recyclingLogSchema.shape.lines.parse(value)
}
