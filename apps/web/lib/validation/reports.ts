import { z } from "zod"

export const reportSchema = z.object({
  townshipId: z.uuid({ error: "Township not found." }),
  targetType: z.enum(["item", "event", "help_request", "message", "profile"]),
  targetId: z.uuid({ error: "Report target not found." }),
  reason: z.enum(["safety", "inappropriate", "spam", "other"]),
  details: z.string().trim().max(1200).default(""),
})
