import { describe, expect, it } from "vitest"

import { clampProgressPercent } from "@/components/recycling/turtle-goal-card"
import { activityLine, describeActivity } from "@/lib/activity"
import { pointReason } from "@/lib/points"
import { recyclingCampaignSchema, recyclingFactorSchema, recyclingLogSchema } from "@/lib/validation/recycling"

const townshipId = "6841e077-fd95-4022-b65a-3f882348dbb6"
const materialId = "6d5728d9-1c8a-4bc7-96c8-298b4462aa11"
const unitId = "9549b8ee-e88d-4b5a-8e04-9d61a8064247"
const currentDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" })

describe("recycling validation", () => {
  it("accepts a count estimate", () => {
    const parsed = recyclingLogSchema.safeParse({
      townshipId,
      method: "count",
      occurredOn: currentDate,
      lines: [{ kind: "count", unitId, quantity: 10 }],
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts a custom kilogram estimate", () => {
    const parsed = recyclingLogSchema.safeParse({
      townshipId,
      method: "custom_kg",
      occurredOn: currentDate,
      lines: [{ kind: "custom_kg", materialId, kg: 2.5 }],
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts up to three estimate photos", () => {
    const parsed = recyclingLogSchema.safeParse({
      townshipId,
      method: "count",
      occurredOn: currentDate,
      photoPaths: [
        "https://storage.example.test/recycling/one.webp",
        "https://storage.example.test/recycling/two.webp",
      ],
      lines: [{ kind: "count", unitId, quantity: 10 }],
    })
    expect(parsed.success).toBe(true)
  })

  it("rejects more than three estimate photos", () => {
    const parsed = recyclingLogSchema.safeParse({
      townshipId,
      method: "count",
      occurredOn: currentDate,
      photoPaths: Array.from({ length: 4 }, (_, index) =>
        `https://storage.example.test/recycling/${index}.webp`
      ),
      lines: [{ kind: "count", unitId, quantity: 10 }],
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects mixed estimate methods", () => {
    const parsed = recyclingLogSchema.safeParse({
      townshipId,
      method: "count",
      occurredOn: currentDate,
      lines: [{ kind: "custom_kg", materialId, kg: 2.5 }],
    })
    expect(parsed.success).toBe(false)
  })

  it("requires a cited factor source", () => {
    const parsed = recyclingFactorSchema.safeParse({
      townshipId,
      slug: "plastic",
      co2eKgPerKg: 1.02,
      energyKwhPerKg: 11.31,
      source: "",
    })
    expect(parsed.success).toBe(false)
  })

  it("accepts a positive campaign target", () => {
    const parsed = recyclingCampaignSchema.safeParse({
      townshipId,
      title: "October recycling goal",
      startsOn: currentDate,
      endsOn: currentDate,
      targetKg: 250,
      status: "active",
    })
    expect(parsed.success).toBe(true)
  })
})

describe("recycling display helpers", () => {
  it("clamps turtle progress to the accessible 0-100 range", () => {
    expect(clampProgressPercent(-4)).toBe(0)
    expect(clampProgressPercent(42)).toBe(42)
    expect(clampProgressPercent(140)).toBe(100)
  })

  it("labels the recycling reward reason", () => {
    expect(pointReason("recycling_goal_completed", 50)).toBe(
      "50 BP · Township recycling goal completed"
    )
  })

  it("maps recycling rewards to the Rimba line", () => {
    expect(describeActivity("recycling_goal_completed")).toBe("Township recycling goal completed")
    expect(activityLine("recycling_goal_completed")).toBe("Rimba")
  })
})
