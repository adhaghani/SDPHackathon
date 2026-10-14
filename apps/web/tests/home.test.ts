// @vitest-environment node
import { describe, expect, it } from "vitest"
import { bookingNextStep, settleSection, type NextBooking } from "@/lib/home"

const booking: NextBooking = {
  id: "loan",
  status: "requested",
  borrower_id: "resident",
  lender_id: "lender",
  end_date: "2026-10-20",
  borrower_handover_confirmed_at: null,
  lender_handover_confirmed_at: null,
  borrower_return_marked_at: null,
  items: { title: "Drill" },
}

describe("Home tasks", () => {
  it("shows approvals only to the lender", () => {
    expect(bookingNextStep(booking, "lender")).toBe("Review request")
    expect(bookingNextStep(booking, "resident")).toBeNull()
  })
  it("does not ask residents to repeat their handover confirmation", () => {
    const approved = {
      ...booking,
      status: "approved",
      borrower_handover_confirmed_at: "now",
    }
    expect(bookingNextStep(approved, "resident")).toBeNull()
    expect(bookingNextStep(approved, "lender")).toBe("Confirm handover")
  })
  it("requires the borrower return mark before asking the lender to confirm", () => {
    const lent = { ...booking, status: "handed_over" }
    expect(bookingNextStep(lent, "resident")).toBe("Arrange return")
    expect(bookingNextStep(lent, "lender")).toBeNull()
    expect(
      bookingNextStep({ ...lent, borrower_return_marked_at: "now" }, "lender")
    ).toBe("Confirm return")
  })
  it("isolates a rejected recycling service from a successful borrowing section", async () => {
    const [recycling, borrowing] = await Promise.all([
      settleSection(Promise.reject(new Error("unavailable"))),
      settleSection(Promise.resolve({ data: [booking], error: null })),
    ])
    expect(recycling.error).toBeTruthy()
    expect(borrowing.data).toEqual([booking])
  })
})
