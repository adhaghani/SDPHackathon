import { z } from "zod"

export const signInSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(1, { error: "Enter your password." }),
  next: z.string().optional(),
})

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { error: "Enter at least 2 characters." })
    .max(80, { error: "Use 80 characters or fewer." }),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { error: "Use at least 8 characters." })
    .regex(/[A-Za-z]/, { error: "Include at least one letter." })
    .regex(/[0-9]/, { error: "Include at least one number." }),
  acceptedTerms: z
    .boolean()
    .refine((value) => value, { error: "Accept the terms to continue." }),
  acceptedPrivacy: z
    .boolean()
    .refine((value) => value, {
      error: "Accept the privacy notice to continue.",
    }),
})

export const magicLinkSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
