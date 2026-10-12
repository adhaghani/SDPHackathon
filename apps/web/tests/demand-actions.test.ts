import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireActiveMember: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.requireActiveMember }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url)
    throw new Error(`redirect:${url}`)
  },
}))

import { bookBundle } from "@/actions/bundles"
import { addWishlistAction, sendForecastNudgeAction } from "@/actions/demand"
import { offerItemRequest, postItemRequest } from "@/actions/requests"

describe("demand Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireActiveMember.mockResolvedValue({
      townshipId: "township-1",
      user: { id: "user-1" },
      membership: { neighbourhood_id: "neighbourhood-1", role: "township_admin" },
    })
  })

  it("posts a valid request and resolves its category", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "category-1" }, error: null })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const rpc = vi.fn().mockResolvedValue({
      data: { request_id: "request-1" },
      error: null,
    })
    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) =>
        table === "item_categories" ? { select: () => ({ eq: () => ({ maybeSingle }) }) } : { upsert }
      ),
      rpc,
    })

    const formData = new FormData()
    formData.set("title", "Need a drill")
    formData.set("categorySlug", "home-tools")
    formData.set("alertOptIn", "on")

    const state = await postItemRequest({ status: "idle" }, formData)
    expect(state.status).toBe("success")
    expect(state.requestId).toBe("request-1")
    expect(rpc).toHaveBeenCalledWith("create_item_request", expect.objectContaining({
      p_payload: expect.objectContaining({ category_id: "category-1" }),
    }))
    expect(upsert).toHaveBeenCalled()
  })

  it("rejects malformed offers before calling Supabase", async () => {
    const rpc = vi.fn()
    mocks.createClient.mockResolvedValue({ rpc })
    const formData = new FormData()
    formData.set("requestId", "not-a-uuid")

    const state = await offerItemRequest({ status: "idle" }, formData)
    expect(state.status).toBe("error")
    expect(rpc).not.toHaveBeenCalled()
  })

  it("rejects a bundle with the end date before the start date", async () => {
    const rpc = vi.fn()
    mocks.createClient.mockResolvedValue({ rpc })
    const formData = new FormData()
    formData.set("bundleId", "00000000-0000-4000-8000-000000000001")
    formData.set("startDate", "2026-11-10")
    formData.set("endDate", "2026-11-09")
    formData.set("handoverMethod", "Clubhouse lobby")

    const state = await bookBundle({ status: "idle" }, formData)
    expect(state.status).toBe("error")
    expect(rpc).not.toHaveBeenCalled()
  })

  it("adds a valid aggregate demand label to the shared wishlist", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "category-1" }, error: null })
    const rpc = vi.fn().mockResolvedValue({ data: { wishlist_id: "wishlist-1" }, error: null })
    mocks.createClient.mockResolvedValue({
      from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) })),
      rpc,
    })
    const formData = new FormData()
    formData.set("categorySlug", "home-tools")
    formData.set("normalizedTerm", "drill")
    formData.set("label", "Cordless drills for the shared library")

    const state = await addWishlistAction({ status: "idle" }, formData)
    expect(state.status).toBe("success")
    expect(rpc).toHaveBeenCalledWith("add_shared_library_wishlist", {
      p_category_id: "category-1",
      p_normalized_term: "drill",
      p_label: "Cordless drills for the shared library",
    })
  })

  it("runs lazy forecast nudges without trusting client input", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 4, error: null })
    mocks.createClient.mockResolvedValue({ rpc })

    const result = await sendForecastNudgeAction()
    expect(result).toEqual({ status: "success", count: 4 })
    expect(rpc).toHaveBeenCalledWith("send_forecast_nudges", {
      p_township_id: "township-1",
    })
  })
})
