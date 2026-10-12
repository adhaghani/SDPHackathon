import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireActiveMember: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.requireActiveMember }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import { approveHighlightAction, saveCarbonGoalAction } from "@/actions/admin"
import { createInvite } from "@/actions/invites"
import { updateProfile } from "@/actions/profile"

describe("engagement Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireActiveMember.mockResolvedValue({ townshipId: "township-1" })
  })

  it("creates or reuses an invite code", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { code: "ABC123" }, error: null })
    mocks.createClient.mockResolvedValue({ rpc })

    const state = await createInvite({ status: "idle" }, new FormData())
    expect(state).toMatchObject({ status: "success", code: "ABC123" })
    expect(rpc).toHaveBeenCalledWith("get_or_create_invite")
  })

  it("persists the highlight opt-in through the extended profile function", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: {}, error: null })
    mocks.createClient.mockResolvedValue({ rpc })
    const formData = new FormData()
    formData.set("displayName", "Aisyah")
    formData.set("showInHighlights", "on")

    const state = await updateProfile({ status: "idle" }, formData)
    expect(state.status).toBe("success")
    expect(rpc).toHaveBeenCalledWith("update_profile", expect.objectContaining({
      p_show_in_highlights: true,
    }))
  })

  it("rejects an invalid carbon goal before calling Supabase", async () => {
    const rpc = vi.fn()
    mocks.createClient.mockResolvedValue({ rpc })
    const formData = new FormData()
    formData.set("year", "2026")
    formData.set("targetKg", "-1")

    const state = await saveCarbonGoalAction({ status: "idle" }, formData)
    expect(state.status).toBe("error")
    expect(rpc).not.toHaveBeenCalled()
  })

  it("rejects an invalid highlight approval before calling Supabase", async () => {
    const rpc = vi.fn()
    mocks.createClient.mockResolvedValue({ rpc })
    const formData = new FormData()
    formData.set("monthStart", "2026-10-12")
    formData.set("residentId", "not-a-uuid")
    formData.set("reason", "Helped neighbours")

    const state = await approveHighlightAction({ status: "idle" }, formData)
    expect(state.status).toBe("error")
    expect(rpc).not.toHaveBeenCalled()
  })
})
