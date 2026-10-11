import { z } from "zod"

export const memberActionSchema = z.object({
  memberId: z.uuid({ error: "Member not found." }),
  approve: z.enum(["approve", "reject"]),
})

export const moderationSchema = z.object({
  reportId: z.uuid({ error: "Report not found." }),
  action: z.enum(["dismiss", "hide", "actioned"]),
})
