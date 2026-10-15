import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  guard: vi.fn(),
  send: vi.fn(),
  update: vi.fn(),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/platform", () => ({ requirePlatformAdmin: mocks.guard }))
vi.mock("@/lib/env", () => ({
  getAppUrl: () => "https://borrowlah.test",
  getSupabaseUrl: () => "https://supabase.test",
  getPublishableKey: () => "public-test-key",
}))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithOtp: mocks.send } }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    auth: {
      getUser: async () => ({ data: { user: { id: "invited-user" } } }),
      updateUser: mocks.update,
    },
  }),
}))

import { acceptManager, appointManager } from "@/actions/platform"

function appointment(email = "manager@example.test") {
  const form = new FormData()
  form.set("townshipId", "00000000-0000-4000-9000-000000000001")
  form.set("displayName", "Town Manager")
  form.set("email", email)
  return form
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.guard.mockResolvedValue({ supabase: { rpc: mocks.rpc } })
  mocks.send.mockResolvedValue({ error: null })
})

describe("platform manager appointment", () => {
  it("appoints verified accounts without sending a password email", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id: "invitation", status: "accepted" },
      error: null,
    })
    expect(
      (await appointManager({ status: "idle" }, appointment())).status
    ).toBe("success")
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it("records failed email delivery and never claims the invitation was sent", async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: { id: "invitation", status: "pending" },
        error: null,
      })
      .mockResolvedValueOnce({ error: null })
    mocks.send.mockResolvedValue({ error: { message: "SMTP unavailable" } })
    const result = await appointManager({ status: "idle" }, appointment())
    expect(result.status).toBe("error")
    expect(result.message).toContain("email could not be sent")
    expect(mocks.rpc).toHaveBeenLastCalledWith("platform_record_delivery", {
      p_id: "invitation",
      p_succeeded: false,
    })
  })
  it("does not report success if delivery state cannot be persisted", async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: { id: "invitation", status: "pending" },
        error: null,
      })
      .mockResolvedValueOnce({ error: { message: "Database unavailable" } })
    const result = await appointManager({ status: "idle" }, appointment())
    expect(result.status).toBe("error")
    expect(result.message).toContain("could not be recorded")
  })
  it("rejects malformed appointments before writing or sending mail", async () => {
    expect(
      (await appointManager({ status: "idle" }, appointment("not-an-email")))
        .status
    ).toBe("error")
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it("checks platform authorization before any provisioning", async () => {
    mocks.guard.mockRejectedValue(new Error("access denied"))
    await expect(
      appointManager({ status: "idle" }, appointment())
    ).rejects.toThrow("access denied")
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it("does not change the password or grant access for a revoked appointment", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null })
    const form = new FormData()
    form.set("password", "a-long-test-password")
    form.set("confirmPassword", "a-long-test-password")
    form.set("acceptedTerms", "on")
    expect((await acceptManager({ status: "idle" }, form)).status).toBe("error")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
  })
})
