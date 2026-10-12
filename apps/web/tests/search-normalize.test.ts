import { describe, expect, it } from "vitest"

import { normalizeSearchTerm } from "@/lib/search-normalize"

describe("normalizeSearchTerm", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeSearchTerm("  Cordless   Drill  ")).toBe("cordless drill")
  })

  it.each([
    ["DRILL", "drill"],
    ["gerudi", "drill"],
    ["Tangga", "ladder"],
    ["meja", "table"],
    ["kerusi", "chair"],
    ["periuk", "pot"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeSearchTerm(input)).toBe(expected)
  })

  it("leaves unknown searches intact", () => {
    expect(normalizeSearchTerm("Sewing machine")).toBe("sewing machine")
  })
})
