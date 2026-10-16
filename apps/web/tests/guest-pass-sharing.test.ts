import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { decryptGuestPassCredentials, encryptGuestPassCredentials } from "@/lib/guest-pass-sharing"

describe("guest pass sharing credentials", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("encrypts and decrypts credentials for the pass host", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-service-role-secret")
    const encrypted = encryptGuestPassCredentials({ token: "private-token", shortCode: "ABCD2345" }, "host-one")

    expect(encrypted).not.toContain("private-token")
    expect(decryptGuestPassCredentials(encrypted, "host-one")).toEqual({ token: "private-token", shortCode: "ABCD2345" })
  })

  it("rejects credentials opened for another host", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-service-role-secret")
    const encrypted = encryptGuestPassCredentials({ token: "private-token", shortCode: "ABCD2345" }, "host-one")

    expect(() => decryptGuestPassCredentials(encrypted, "host-two")).toThrow()
  })
})
