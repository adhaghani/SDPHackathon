import { describe, expect, it } from "vitest"

import { estimatedValueShared, sumEstimatedValueShared } from "@/lib/impact"
import { parseTrustScore, trustTier, trustTierLabel } from "@/lib/trust"

describe("trust tiers", () => {
  it.each([
    [0, "building"],
    [39, "building"],
    [40, "trusted"],
    [74, "trusted"],
    [75, "highly_trusted"],
    [100, "highly_trusted"],
  ])("maps score %i to %s", (score, tier) => {
    expect(trustTier(score)).toBe(tier)
    expect(trustTierLabel(tier)).toBeTruthy()
  })

  it("parses server payloads defensively", () => {
    expect(parseTrustScore({ score: 76, tier: "highly_trusted" })?.score).toBe(76)
    expect(parseTrustScore(null)).toBeNull()
  })
})

describe("estimated value shared", () => {
  it("uses item value before category fallback", () => {
    expect(estimatedValueShared({ estimated_new_price_rm: 120, typical_new_price_rm: 250 })).toBe(120)
    expect(estimatedValueShared({ typical_new_price_rm: 250 })).toBe(250)
    expect(estimatedValueShared({})).toBe(0)
  })

  it("sums completed-borrow value", () => {
    expect(
      sumEstimatedValueShared([
        { estimated_new_price_rm: 120 },
        { typical_new_price_rm: 80 },
        {},
      ])
    ).toBe(200)
  })
})
