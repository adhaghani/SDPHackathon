import { describe, expect, it } from "vitest"
import {
  boundarySchema,
  managerSchema,
  townshipError,
} from "@/lib/validation/township"

describe("township provisioning inputs", () => {
  it("requires closed rings with finite geographic coordinates", () => {
    expect(
      boundarySchema.safeParse({
        type: "Polygon",
        coordinates: [
          [
            [101, 3],
            [102, 3],
            [102, 4],
            [101, 3],
          ],
        ],
      }).success
    ).toBe(true)
    for (const coordinates of [
      [
        [
          [101, 3],
          [102, 3],
          [102, 4],
          [101, 4],
        ],
      ],
      [
        [
          [181, 3],
          [182, 3],
          [182, 4],
          [181, 3],
        ],
      ],
      [
        [
          [101, 3],
          [Infinity, 3],
          [102, 4],
          [101, 3],
        ],
      ],
    ])
      expect(
        boundarySchema.safeParse({ type: "Polygon", coordinates }).success
      ).toBe(false)
  })
  it("normalizes manager email and rejects empty names", () => {
    const parsed = managerSchema.parse({
      townshipId: "00000000-0000-4000-9000-000000000001",
      displayName: " Town Manager ",
      email: " OWNER@Example.com ",
    })
    expect(parsed.email).toBe("owner@example.com")
    expect(parsed.displayName).toBe("Town Manager")
    expect(
      managerSchema.safeParse({ ...parsed, displayName: " " }).success
    ).toBe(false)
  })
  it("does not expose arbitrary database errors to the UI", () => {
    expect(townshipError("private database connection details")).not.toContain(
      "private"
    )
    expect(townshipError("boundary_overlap_confirmation_required")).toContain(
      "overlap"
    )
  })
})
