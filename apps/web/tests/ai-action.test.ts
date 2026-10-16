import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  suggest: vi.fn(),
  suggestGiveaway: vi.fn(),
}))
vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.member }))
vi.mock("@/lib/ai", () => ({
  suggestListingFromPhoto: mocks.suggest,
  suggestGiveawayFromPhoto: mocks.suggestGiveaway,
}))
import { suggestGiveawayListing, suggestListing } from "@/actions/ai"

beforeEach(() => vi.resetAllMocks())

describe("photo suggestion action", () => {
  function photoForm() {
    const form = new FormData()
    form.set("imageDataUrl", "data:image/png;base64,AA==")
    form.set("fileName", "photo.png")
    return form
  }

  it("requires active membership before making a paid AI request", async () => {
    mocks.member.mockRejectedValue(new Error("unauthorized"))
    expect((await suggestListing({ status: "idle" }, photoForm())).status).toBe("error")
    expect(mocks.suggest).not.toHaveBeenCalled()
  })

  it("returns suggestions for an active member", async () => {
    mocks.member.mockResolvedValue({})
    mocks.suggest.mockResolvedValue({ source: "ai", title: "Drill" })
    expect(await suggestListing({ status: "idle" }, photoForm())).toMatchObject({
      status: "success", suggestion: { title: "Drill", source: "ai" },
    })
  })

  it("returns giveaway-specific suggestions for an active member", async () => {
    mocks.member.mockResolvedValue({})
    mocks.suggestGiveaway.mockResolvedValue({
      source: "ai",
      title: "Desk fan",
      condition: "worn",
    })

    expect(
      await suggestGiveawayListing({ status: "idle" }, photoForm())
    ).toMatchObject({
      status: "success",
      suggestion: { title: "Desk fan", condition: "worn", source: "ai" },
    })
  })
})
