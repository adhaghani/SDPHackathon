import { describe, expect, it } from "vitest"

import { POINT_RULES, pointReason } from "@/lib/points"

describe("point reasons", () => {
  it("renders a plain verified reason with the awarded amount", () => {
    expect(pointReason("item_lent_completed", 40)).toBe(
      "40 BP · Return confirmed by both sides"
    )
  })

  it("falls back safely for unknown actions", () => {
    expect(pointReason("unknown_action", 7)).toBe(
      "7 BP · Verified township activity"
    )
  })

  it("keeps all Feature Pack action reasons in one client config", () => {
    expect(Object.keys(POINT_RULES)).toEqual(
      expect.arrayContaining([
        "item_request_fulfilled",
        "item_guide_added",
        "streak_milestone_3",
        "invite_accepted",
        "neighbour_of_month",
      ])
    )
  })
})
