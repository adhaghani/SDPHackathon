import { describe, expect, it } from "vitest"

import { fallbackSuggestion, parseListingSuggestion } from "@/lib/ai/item-suggest"
import { redactPersonalData } from "@/lib/ai/privacy"

describe("Snap to list fallback and parsing", () => {
  it("falls back to a local filename title without sending it to AI", () => {
    const suggestion = fallbackSuggestion("Cordless Drill 01.webp")
    expect(suggestion.source).toBe("fallback")
    expect(suggestion.title).toBe("Cordless Drill 01")
    expect(suggestion.categorySlug).toBe("")
  })

  it("accepts a structured AI response only from known categories", () => {
    const parsed = parseListingSuggestion(
      '{"title":"Folding ladder","category":"home-tools","estimated_value_rm":180,"condition":"good","description":"Telescopic ladder."}'
    )
    expect(parsed).toMatchObject({
      title: "Folding ladder",
      categorySlug: "home-tools",
      estimatedValueRm: 180,
      source: "ai",
    })
    expect(parseListingSuggestion('{"title":"Ladder","category":"unknown"}')?.categorySlug).toBe("")
    expect(parseListingSuggestion("not json")).toBeNull()
  })

  it("redacts personal identifiers before prompts are sent", () => {
    const redacted = redactPersonalData(
      "Call 012-345 6789 at unit #12 or aisyah@example.com"
    )
    expect(redacted).not.toMatch(/012-345/)
    expect(redacted).not.toMatch(/unit #12/i)
    expect(redacted).not.toMatch(/aisyah@example.com/)
  })
})
