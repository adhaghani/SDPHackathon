import { describe, expect, it } from "vitest"

import {
  fallbackGiveawaySuggestion,
  parseGiveawaySuggestion,
} from "@/lib/ai/giveaway-suggest"

describe("giveaway photo suggestion parsing", () => {
  it("accepts giveaway fields and condition values", () => {
    expect(
      parseGiveawaySuggestion(
        '{"title":"Desk fan","category":"home-tools","condition":"worn","description":"Visible surface wear. Confirm whether it works."}'
      )
    ).toMatchObject({
      title: "Desk fan",
      categorySlug: "home-tools",
      condition: "worn",
      source: "ai",
    })
  })

  it("rejects missing titles and ignores unknown categories", () => {
    expect(parseGiveawaySuggestion('{"title":"","condition":"good"}')).toBeNull()
    expect(
      parseGiveawaySuggestion(
        '{"title":"Fan","category":"unknown","condition":"good"}'
      )?.categorySlug
    ).toBe("")
  })

  it("rejects unknown conditions instead of presenting a guess as fact", () => {
    expect(
      parseGiveawaySuggestion('{"title":"Fan","condition":"pristine"}')
    ).toBeNull()
  })

  it("provides a filename fallback without claiming item details", () => {
    expect(fallbackGiveawaySuggestion("Old_Desk-Fan.webp")).toEqual({
      title: "Old Desk Fan",
      categorySlug: "",
      condition: "unusable",
      description: "",
      source: "fallback",
    })
  })
})
