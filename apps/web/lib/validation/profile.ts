import { z } from "zod"

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, { error: "Use at least 2 characters." }).max(80),
  interests: z.array(z.string()).max(10).default([]),
  largeText: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  reduceMotion: z.boolean().default(false),
  recognitionOptIn: z.boolean().default(false),
  showInHighlights: z.boolean().default(false),
})
