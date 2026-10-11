import { describe, expect, it } from "vitest"

import { signInSchema, signUpSchema } from "@/lib/validation/auth"

describe("auth validation", () => {
  it("accepts a valid sign-in payload", () => {
    const result = signInSchema.safeParse({
      email: "aisyah@example.test",
      password: "correct-horse-1",
    })

    expect(result.success).toBe(true)
  })

  it("rejects malformed emails with an actionable message", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "correct-horse-1",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toEqual([
        "Enter a valid email address.",
      ])
    }
  })

  it("requires both consent checkboxes", () => {
    const result = signUpSchema.safeParse({
      displayName: "Aisyah",
      email: "aisyah@example.test",
      password: "secure123",
      acceptedTerms: false,
      acceptedPrivacy: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.acceptedTerms).toHaveLength(1)
      expect(result.error.flatten().fieldErrors.acceptedPrivacy).toHaveLength(1)
    }
  })
})
