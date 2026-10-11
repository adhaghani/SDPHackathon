import { z } from "zod"

export const joinCodeSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(4, { error: "Enter the join code from your township office." })
    .max(32, { error: "Use 32 characters or fewer." }),
})

export const joinTownshipSchema = joinCodeSchema.extend({
  neighbourhoodId: z.uuid({ error: "Choose a neighbourhood." }),
  unitLabel: z
    .string()
    .trim()
    .max(80, { error: "Use 80 characters or fewer." })
    .optional(),
})
