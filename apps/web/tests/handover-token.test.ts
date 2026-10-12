import { describe, expect, it } from "vitest"

import { createHandoverToken, verifyHandoverToken } from "@/lib/handover-token"

describe("offline handover token", () => {
  const now = 1_800_000_000_000
  const payload = {
    typ: "booking_handover" as const,
    booking: "00000000-0000-4000-8000-000000000001",
    jti: "abc123",
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 1800,
  }

  it("signs and verifies a booking-bound token", () => {
    const token = createHandoverToken(payload, "test-secret")
    expect(verifyHandoverToken(token, "test-secret", now)).toMatchObject({
      booking: payload.booking,
      jti: payload.jti,
    })
  })

  it("rejects tampering and expiry", () => {
    const token = createHandoverToken(payload, "test-secret")
    expect(() => verifyHandoverToken(`${token}x`, "test-secret", now)).toThrow()
    expect(() => verifyHandoverToken(token, "test-secret", now + 1_801_000)).toThrow()
    expect(() => verifyHandoverToken(token, "wrong-secret", now)).toThrow()
  })
})
