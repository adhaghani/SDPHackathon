// @vitest-environment node
import { describe, expect, it } from "vitest"
import { getDemoJourney, parsePreviewTask } from "@/lib/judges/journey"
import { initialPreviewState } from "@/lib/judges/seed"

describe("connected judges walkthrough", () => {
  it("does not treat an approved or collected loan as a completed return", () => {
    expect(
      getDemoJourney({ ...initialPreviewState, bookings: { washer: 4 } })[0]
        ?.done
    ).toBe(false)
    expect(
      getDemoJourney({ ...initialPreviewState, bookings: { washer: 6 } })[0]
        ?.done
    ).toBe(true)
  })
  it("routes an unregistered attendee back to resident RSVP first", () => {
    const attendance = getDemoJourney({
      ...initialPreviewState,
      checkedIn: ["aisyah"],
    })[2]!
    expect(attendance.done).toBe(false)
    expect(attendance.href).toBe("/preview/resident?task=events")
  })
  it("recognises completion across all four role perspectives", () => {
    const steps = getDemoJourney({
      ...initialPreviewState,
      bookings: { drill: 6 },
      rsvp: true,
      checkedIn: ["aisyah"],
      departures: ["DEMO-1024"],
      membership: "approved",
    })
    expect(steps.every((step) => step.done)).toBe(true)
  })
  it("accepts only supported single-value task deep links", () => {
    expect(parsePreviewTask("events")).toBe("events")
    expect(parsePreviewTask(["borrow", "events"])).toBeUndefined()
    expect(parsePreviewTask("unknown")).toBeUndefined()
  })
})
