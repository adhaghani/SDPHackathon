import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  member: vi.fn(),
  revalidate: vi.fn(),
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.member }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mocks.rpc }),
}))
import { saveBadge } from "@/actions/admin"

function form(rule?: object) {
  const value = new FormData()
  for (const [key, text] of Object.entries({
    slug: "good-neighbour",
    name: "Good neighbour",
    description: "Verified sharing activity.",
    icon: "hand-heart",
  }))
    value.set(key, text)
  if (rule) value.set("criteria", JSON.stringify(rule))
  return value
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.member.mockResolvedValue({ membership: { role: "township_admin" } })
  mocks.rpc.mockResolvedValue({ error: null })
})
describe("badge admin saving", () => {
  it("omits the rule on copy-only updates", async () => {
    expect((await saveBadge({ status: "idle" }, form())).status).toBe("success")
    expect(mocks.rpc.mock.calls[0]?.[1]).not.toHaveProperty("p_criteria")
    expect(mocks.revalidate).toHaveBeenCalledWith("/profile")
  })
  it("passes explicitly configured requirements intact", async () => {
    const rule = {
      type: "count",
      threshold: 5,
      action_types: ["event_attendance"],
      metadata: { counts_as_sustainability: true },
    }
    await saveBadge({ status: "idle" }, form(rule))
    expect(mocks.rpc).toHaveBeenCalledWith(
      "save_badge_definition",
      expect.objectContaining({ p_criteria: rule })
    )
  })
  it("rejects invalid requirements without writing", async () => {
    expect(
      (
        await saveBadge(
          { status: "idle" },
          form({ type: "streak", threshold: -1 })
        )
      ).status
    ).toBe("error")
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it("rejects residents even with valid inputs", async () => {
    mocks.member.mockResolvedValue({ membership: { role: "resident" } })
    expect((await saveBadge({ status: "idle" }, form())).status).toBe("error")
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
