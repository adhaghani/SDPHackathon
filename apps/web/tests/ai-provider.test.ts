import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  openAICompletion: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/ai/openai", () => ({ openAICompletion: mocks.openAICompletion }))

import {
  generateAdminSummary,
  generateHelpAnswer,
  suggestGiveawayFromPhoto,
  suggestListingFromPhoto,
} from "@/lib/ai"

describe("provider-gated AI features", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.AI_API_KEY
    delete process.env.AI_PROVIDER
    delete process.env.AI_MODEL
    delete process.env.AI_PROVIDER_LINK
  })

  afterEach(() => {
    delete process.env.AI_API_KEY
    delete process.env.AI_PROVIDER
    delete process.env.AI_MODEL
    delete process.env.AI_PROVIDER_LINK
  })

  it("uses deterministic fallbacks when AI_API_KEY is absent", async () => {
    mocks.openAICompletion.mockResolvedValue("should not run")

    expect(
      await generateHelpAnswer("How does handover work?", [
        { title: "Handover", body: "Both sides confirm." },
      ])
    ).toBeNull()

    const suggestion = await suggestListingFromPhoto(
      "data:image/webp;base64,AA==",
      "Cordless Drill.webp"
    )
    expect(suggestion.source).toBe("fallback")
    expect(suggestion.title).toBe("Cordless Drill")
    expect(mocks.openAICompletion).not.toHaveBeenCalled()

    const giveawaySuggestion = await suggestGiveawayFromPhoto(
      "data:image/webp;base64,AA==",
      "Desk Fan.webp"
    )
    expect(giveawaySuggestion).toMatchObject({
      source: "fallback",
      title: "Desk Fan",
    })

    const summary = await generateAdminSummary({ active_residents: 5 })
    expect(summary.source).toBe("deterministic")
  })

  it("uses the installed OpenAI adapter when AI_API_KEY is set", async () => {
    process.env.AI_API_KEY = "test-key"
    mocks.openAICompletion
      .mockResolvedValueOnce("Both sides confirm the handover.")
      .mockResolvedValueOnce("Demand is steady across five residents.")
      .mockResolvedValueOnce(
        '{"title":"Cordless drill","category":"home-tools","estimated_value_rm":180,"condition":"good","description":"Compact drill.","guide_body":"Fit the correct bit before use.","safety_note":"Wear eye protection."}'
      )
      .mockResolvedValueOnce(
        '{"title":"Desk fan","category":"home-tools","condition":"worn","description":"Visible surface wear. Confirm whether it works."}'
      )

    const answer = await generateHelpAnswer("How does handover work?", [
      { title: "Handover", body: "Both sides confirm." },
    ])
    expect(answer).toContain("Both sides confirm")

    const summary = await generateAdminSummary({ active_residents: 5 })
    expect(summary.source).toBe("ai")

    const suggestion = await suggestListingFromPhoto(
      "data:image/webp;base64,AA==",
      "photo.webp"
    )
    expect(suggestion).toMatchObject({
      source: "ai",
      categorySlug: "home-tools",
      estimatedValueRm: 180,
    })
    const giveawaySuggestion = await suggestGiveawayFromPhoto(
      "data:image/webp;base64,AA==",
      "photo.webp"
    )
    expect(giveawaySuggestion).toMatchObject({
      source: "ai",
      categorySlug: "home-tools",
      condition: "worn",
    })
    expect(mocks.openAICompletion).toHaveBeenCalledTimes(4)
  })

  it("falls back for unsupported providers even when a key exists", async () => {
    process.env.AI_API_KEY = "test-key"
    process.env.AI_PROVIDER = "unsupported"

    expect(
      await generateHelpAnswer("Question", [{ title: "Help", body: "Answer" }])
    ).toBeNull()
    expect(mocks.openAICompletion).not.toHaveBeenCalled()
  })
  it.each(["mimo", "xiaomi", " Xiaomi MiMO "])(
    "routes %s with its configured model and endpoint",
    async (provider) => {
      process.env.AI_API_KEY = "test-key"
      process.env.AI_PROVIDER = provider
      process.env.AI_MODEL = "mimo-v2.6-flash"
      process.env.AI_PROVIDER_LINK = "https://api.xiaomimimo.com/v1"
      mocks.openAICompletion.mockResolvedValue("Follow the Handover article.")
      await generateHelpAnswer("How?", [
        { title: "Handover", body: "Both sides confirm." },
      ])
      expect(mocks.openAICompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: "mimo-v2.6-flash",
          baseURL: "https://api.xiaomimimo.com/v1",
          chatCompletions: true,
          system: expect.stringContaining("plain-text paragraphs"),
        })
      )
    }
  )

  it("falls back for provider errors, blank responses and invalid listing JSON", async () => {
    process.env.AI_API_KEY = "test-key"
    mocks.openAICompletion.mockRejectedValueOnce(new Error("unavailable"))
    expect((await generateAdminSummary({ active_residents: 5 })).source).toBe(
      "deterministic"
    )
    mocks.openAICompletion.mockResolvedValueOnce("   ")
    expect(
      await generateHelpAnswer("How?", [{ title: "Help", body: "Steps" }])
    ).toBeNull()
    mocks.openAICompletion.mockResolvedValueOnce("not json")
    expect(
      (await suggestListingFromPhoto("data:image/png;base64,AA==", "photo.png"))
        .source
    ).toBe("fallback")
  })

  it("uses scenario prompts and redacts identifiers from text requests", async () => {
    process.env.AI_API_KEY = "test-key"
    mocks.openAICompletion.mockResolvedValue("A useful answer.")
    await generateHelpAnswer("Contact me at person@example.com", [
      { title: "Help", body: "Read this." },
    ])
    expect(mocks.openAICompletion.mock.calls[0]?.[0]).toMatchObject({
      prompt: expect.not.stringContaining("person@example.com"),
      system: expect.stringContaining("ONLY from the supplied help articles"),
    })
    await generateAdminSummary({ active_residents: 5 })
    expect(mocks.openAICompletion.mock.calls[1]?.[0].system).toContain(
      "suppressed values are unknown"
    )
    expect(mocks.openAICompletion.mock.calls[1]?.[0].system).toContain(
      "plain-text paragraphs"
    )
    await suggestListingFromPhoto("data:image/png;base64,AA==", "photo.png")
    expect(mocks.openAICompletion.mock.calls[2]?.[0]).toMatchObject({
      imageDataUrl: "data:image/png;base64,AA==",
      system: expect.stringContaining("Return only a JSON object"),
    })
  })

  it("supplies eight guides and bounded conversation context for Help", async () => {
    process.env.AI_API_KEY = "test-key"
    mocks.openAICompletion.mockResolvedValue("Request your dates.")
    const articles = Array.from({ length: 10 }, (_, i) => ({
      title: `Guide ${i}`,
      body: `Steps ${i}`,
    }))
    await generateHelpAnswer(
      "What next?",
      articles,
      [],
      [{ role: "user", content: "How do I borrow?" }]
    )
    const request = mocks.openAICompletion.mock.calls[0]?.[0]
    expect(request.prompt).toContain("Guide 7")
    expect(request.prompt).not.toContain("Guide 8")
    expect(request.prompt).toContain("How do I borrow?")
    expect(request.system).toContain("warm, natural tone")
  })
})
