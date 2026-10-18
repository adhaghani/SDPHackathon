// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  user: { id: "resident" } as { id: string } | null,
  selected: "town-b",
  from: vi.fn(),
}))
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: mocks.selected }) }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
    from: mocks.from,
  }),
}))
import { getSessionContext, getUnreadNotificationCount } from "@/lib/data"

beforeEach(() => {
  mocks.user = { id: "resident" }
  mocks.selected = "town-b"
  mocks.from.mockReset().mockImplementation((table: string) => {
    const rows: Record<string, unknown> = {
      township_members: [
        {
          township_id: "town-a",
          status: "active",
          townships: { name: "Harmoni", lifecycle: "active" },
        },
        {
          township_id: "town-b",
          status: "active",
          townships: { name: "Other township", lifecycle: "active" },
        },
      ],
      profiles: { id: "resident" },
      v_member_points: [
        { township_id: "town-a", balance: 100 },
        { township_id: "town-b", balance: 40 },
      ],
    }
    const result = {
      data: rows[table] ?? null,
      error: null,
      count: table === "notifications" ? 3 : null,
    }
    const chain: Record<string, unknown> = {
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    }
    for (const method of ["select", "eq", "in", "order", "maybeSingle", "is"])
      chain[method] = () => chain
    return chain
  })
})

describe("request-scoped resident context", () => {
  it("uses points for the selected township after parallel reads", async () => {
    const context = await getSessionContext()
    expect(context.membership?.township_id).toBe("town-b")
    expect(context.points?.balance).toBe(40)
  })
  it("keeps the preferred membership and its balance when the cookie is unknown", async () => {
    mocks.selected = "missing-township"
    const context = await getSessionContext()
    expect(context.membership?.township_id).toBe("town-a")
    expect(context.points?.balance).toBe(100)
  })
  it("does not load resident tables for a signed-out request", async () => {
    mocks.user = null
    expect((await getSessionContext()).points).toBeNull()
    expect(await getUnreadNotificationCount()).toBe(0)
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it("loads the unread count independently of selected membership", async () => {
    expect(await getUnreadNotificationCount()).toBe(3)
    expect(mocks.from).toHaveBeenCalledWith("notifications")
    expect(mocks.from).not.toHaveBeenCalledWith("township_members")
  })
})
