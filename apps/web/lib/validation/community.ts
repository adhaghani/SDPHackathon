import { z } from "zod"

export const announcementSchema = z.object({
  title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(120),
  body: z.string().trim().min(3, { error: "Add a short announcement." }).max(1200),
  pinned: z.boolean().default(false),
})

export const helpRequestSchema = z.object({
  title: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(120),
  details: z.string().trim().max(1200).default(""),
  kind: z.enum(["errand", "tech_help", "transport", "companionship", "home_help", "other"]),
  neededBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choose a needed-by date." }).optional(),
})

export const helpActionSchema = z.object({
  requestId: z.uuid({ error: "Help request not found." }),
})

export const groupActionSchema = z.object({
  groupId: z.uuid({ error: "Group not found." }),
})
