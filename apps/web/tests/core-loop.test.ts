// @vitest-environment node
import { describe, expect, it } from "vitest"

import { canTransitionBooking } from "@/lib/booking"
import { estimatedPurchasesAvoided, suppressSmallGroup } from "@/lib/metrics"
import { recommendEvents, recommendItems } from "@/lib/recommendations"
import { canAwardWithCaps, levelForPoints, resolveRewardRule } from "@/lib/points"
import { createTicketToken, readTicketToken } from "@/lib/qr-core"

describe("points engine helpers", () => {
  const rules = [
    { township_id: null, action_type: "event_attendance", category_slug: null, points: 50 },
    { township_id: null, action_type: "event_attendance", category_slug: "gotong-royong", points: 100 },
    { township_id: "demo", action_type: "event_attendance", category_slug: "gotong-royong", points: 120 },
  ]

  it("resolves the most specific rule", () => {
    expect(resolveRewardRule(rules, "event_attendance", "gotong-royong")?.points).toBe(120)
    expect(resolveRewardRule(rules, "event_attendance", "social")?.points).toBe(50)
    expect(resolveRewardRule(rules, "missing")?.points).toBeUndefined()
  })

  it("enforces daily and weekly award-count caps", () => {
    expect(canAwardWithCaps({ dailyCap: 2, weeklyCap: 10, dailyCount: 1, weeklyCount: 3 })).toBe(true)
    expect(canAwardWithCaps({ dailyCap: 2, weeklyCap: null, dailyCount: 2, weeklyCount: 0 })).toBe(false)
    expect(canAwardWithCaps({ dailyCap: null, weeklyCap: 3, dailyCount: 0, weeklyCount: 3 })).toBe(false)
  })

  it("derives levels from lifetime points", () => {
    const levels = [
      { level: 1, name: "Newcomer", min_lifetime_points: 0 },
      { level: 2, name: "Neighbour", min_lifetime_points: 200 },
      { level: 3, name: "Contributor", min_lifetime_points: 600 },
    ]
    expect(levelForPoints(levels, 1250)?.name).toBe("Contributor")
    expect(levelForPoints(levels, 0)?.name).toBe("Newcomer")
  })
})

describe("booking permission matrix", () => {
  it("permits only the lender to approve and both parties to hand over", () => {
    expect(canTransitionBooking({ status: "requested", action: "approve", actor: "lender" })).toBe(true)
    expect(canTransitionBooking({ status: "requested", action: "approve", actor: "borrower" })).toBe(false)
    expect(canTransitionBooking({ status: "approved", action: "confirm_handover", actor: "borrower" })).toBe(true)
    expect(canTransitionBooking({ status: "approved", action: "confirm_handover", actor: "admin" })).toBe(false)
  })

  it("requires the borrower return mark before lender confirmation", () => {
    expect(canTransitionBooking({ status: "handed_over", action: "confirm_return", actor: "lender", borrowerReturnMarked: false })).toBe(false)
    expect(canTransitionBooking({ status: "handed_over", action: "confirm_return", actor: "lender", borrowerReturnMarked: true })).toBe(true)
    expect(canTransitionBooking({ status: "handed_over", action: "mark_returned", actor: "borrower" })).toBe(true)
  })

  it("keeps disputes admin-resolved", () => {
    expect(canTransitionBooking({ status: "handed_over", action: "open_dispute", actor: "borrower" })).toBe(true)
    expect(canTransitionBooking({ status: "disputed", action: "resolve_dispute", actor: "admin" })).toBe(true)
    expect(canTransitionBooking({ status: "disputed", action: "resolve_dispute", actor: "lender" })).toBe(false)
  })
})

describe("impact helpers", () => {
  it("suppresses small groups", () => {
    expect(suppressSmallGroup(4)).toBeNull()
    expect(suppressSmallGroup(5)).toBe(5)
  })

  it("sums estimated purchases avoided only for yes answers", () => {
    expect(
      estimatedPurchasesAvoided([
        { estimated_new_price_rm: 250, would_have_bought: "yes" },
        { estimated_new_price_rm: 100, would_have_bought: "no" },
        { estimated_new_price_rm: 50, would_have_bought: "yes" },
      ])
    ).toBe(300)
  })
})

describe("QR ticket tokens", () => {
  it("signs and verifies a ticket", async () => {
    const token = await createTicketToken({ rsvp: "rsvp-1", evt: "event-1", usr: "user-1" }, "test-secret")
    await expect(readTicketToken(token, "test-secret")).resolves.toEqual({
      rsvp: "rsvp-1",
      evt: "event-1",
      usr: "user-1",
    })
  })

  it("rejects expired or wrong-secret tokens", async () => {
    const token = await createTicketToken({ rsvp: "rsvp-1", evt: "event-1", usr: "user-1" }, "test-secret", -1)
    await expect(readTicketToken(token, "test-secret")).rejects.toThrow()
    const valid = await createTicketToken({ rsvp: "rsvp-1", evt: "event-1", usr: "user-1" }, "test-secret")
    await expect(readTicketToken(valid, "wrong-secret")).rejects.toThrow()
  })
})

describe("Phase 5 recommendations", () => {
  it("explains rule-based event suggestions", () => {
    const recommendations = recommendEvents([
      {
        eventId: "event-1",
        title: "Garden morning",
        categorySlug: "gardening",
        neighbourhoodId: "anggun",
        startsAt: "2026-10-11T19:00:00Z",
        interests: ["garden"],
        pastCategories: ["gardening"],
        userNeighbourhoodId: "anggun",
      },
    ])
    expect(recommendations[0]?.reason).toContain("Because")
    expect(recommendations[0]?.score).toBeGreaterThan(0)
  })

  it("explains rule-based item suggestions", () => {
    const recommendations = recommendItems([
      {
        itemId: "item-1",
        title: "Garden cart",
        categorySlug: "home-tools",
        neighbourhoodId: "anggun",
        interests: ["home-tools"],
        pastCategories: ["home-tools"],
        userNeighbourhoodId: "anggun",
      },
    ])
    expect(recommendations[0]?.reason).toContain("Because")
  })
})
