import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireActiveMember: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.requireActiveMember }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import { saveItemGuide } from "@/actions/guides"

describe("saveItemGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireActiveMember.mockResolvedValue({ townshipId: "township-1" })
  })

  it("saves a valid guide and returns the first-guide reward", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { first_guide: true, points: { delta: 5 } },
      error: null,
    })
    mocks.createClient.mockResolvedValue({ rpc })

    const formData = new FormData()
    formData.set("itemId", "00000000-0000-4000-8000-000000000001")
    formData.set("body", "Lock both feet before climbing.")
    formData.set("safetyNote", "Use on level ground.")

    const state = await saveItemGuide({ status: "idle" }, formData)

    expect(state.status).toBe("success")
    expect(state.points).toBe(5)
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/borrow/items/00000000-0000-4000-8000-000000000001"
    )
    expect(rpc).toHaveBeenCalledWith("save_item_guide", expect.objectContaining({
      p_body: "Lock both feet before climbing.",
      p_photo_paths: [],
    }))
  })

  it("rejects an empty guide without calling the database", async () => {
    const rpc = vi.fn()
    mocks.createClient.mockResolvedValue({ rpc })

    const formData = new FormData()
    formData.set("itemId", "00000000-0000-4000-8000-000000000001")
    formData.set("body", "   ")

    const state = await saveItemGuide({ status: "idle" }, formData)

    expect(state.status).toBe("error")
    expect(rpc).not.toHaveBeenCalled()
  })
})
