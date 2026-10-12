import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  openAICompletion: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/ai/openai", () => ({ openAICompletion: mocks.openAICompletion }))

import {
  generateAdminSummary,
  generateHelpAnswer,
  suggestListingFromPhoto,
} from "@/lib/ai"

describe("provider-gated AI features", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.AI_API_KEY
    delete process.env.AI_PROVIDER
  })

  afterEach(() => {
    delete process.env.AI_API_KEY
    delete process.env.AI_PROVIDER
  })

  it("uses deterministic fallbacks when AI_API_KEY is absent", async () => {
    mocks.openAICompletion.mockResolvedValue("should not run")

    expect(await generateHelpAnswer("How does handover work?", [
      { title: "Handover", body: "Both sides confirm." },
    ])).toBeNull()

    const suggestion = await suggestListingFromPhoto("data:image/webp;base64,AA==", "Cordless Drill.webp")
    expect(suggestion.source).toBe("fallback")
    expect(suggestion.title).toBe("Cordless Drill")
    expect(mocks.openAICompletion).not.toHaveBeenCalled()

    const summary = await generateAdminSummary({ active_residents: 5 })
    expect(summary.source).toBe("deterministic")
  })

  it("uses the installed OpenAI adapter when AI_API_KEY is set", async () => {
    process.env.AI_API_KEY = "test-key"
    mocks.openAICompletion
      .mockResolvedValueOnce("Both sides confirm the handover.")
      .mockResolvedValueOnce("Demand is steady across five residents.")
      .mockResolvedValueOnce(
        '{"title":"Cordless drill","category":"home-tools","estimated_value_rm":180,"condition":"good","description":"Compact drill."}'
      )

    const answer = await generateHelpAnswer("How does handover work?", [
      { title: "Handover", body: "Both sides confirm." },
    ])
    expect(answer).toContain("Both sides confirm")

    const summary = await generateAdminSummary({ active_residents: 5 })
    expect(summary.source).toBe("ai")

    const suggestion = await suggestListingFromPhoto("data:image/webp;base64,AA==", "photo.webp")
    expect(suggestion).toMatchObject({ source: "ai", categorySlug: "home-tools", estimatedValueRm: 180 })
    expect(mocks.openAICompletion).toHaveBeenCalledTimes(3)
  })

  it("falls back for unsupported providers even when a key exists", async () => {
    process.env.AI_API_KEY = "test-key"
    process.env.AI_PROVIDER = "unsupported"

    expect(await generateHelpAnswer("Question", [{ title: "Help", body: "Answer" }])).toBeNull()
    expect(mocks.openAICompletion).not.toHaveBeenCalled()
  })
})
