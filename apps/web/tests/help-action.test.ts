import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireActiveMember: vi.fn(),
  createClient: vi.fn(),
  generateHelpAnswer: vi.fn(),
}))

vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.requireActiveMember }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }))
vi.mock("@/lib/ai", () => ({ generateHelpAnswer: mocks.generateHelpAnswer }))

import { askHelp } from "@/actions/help"

describe("Help chat action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireActiveMember.mockResolvedValue({ townshipId: "township-1" })
  })

  it("returns grounded articles when AI is unavailable", async () => {
    mocks.generateHelpAnswer.mockResolvedValue(null)
    const helpRpc = vi.fn().mockResolvedValue({
      data: {
        conversation_id: "conversation-1",
        articles: [{ id: "article-1", slug: "handover", title: "Handover", body: "Steps", category: "handover" }],
        messages: [{ id: "message-1", role: "user", content: "How?" }],
      },
      error: null,
    })
    const statusRpc = vi.fn().mockResolvedValue({ data: [{ status: "approved" }], error: null })
    mocks.createClient.mockResolvedValue({
      rpc: vi.fn((name: string) => (name === "send_help_message" ? helpRpc() : statusRpc())),
    })

    const formData = new FormData()
    formData.set("question", "How does handover work?")
    const state = await askHelp({ status: "idle" }, formData)
    expect(state.status).toBe("success")
    expect(state.source).toBe("articles")
    expect(state.articles?.[0]?.slug).toBe("handover")
    expect(mocks.generateHelpAnswer).toHaveBeenCalled()
  })

  it("maps the hourly rate limit to an inline error", async () => {
    mocks.generateHelpAnswer.mockResolvedValue(null)
    const helpRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "help_rate_limited" },
    })
    const statusRpc = vi.fn().mockResolvedValue({ data: [], error: null })
    mocks.createClient.mockResolvedValue({
      rpc: vi.fn((name: string) => (name === "send_help_message" ? helpRpc() : statusRpc())),
    })

    const formData = new FormData()
    formData.set("question", "Another question")
    const state = await askHelp({ status: "idle" }, formData)
    expect(state.status).toBe("error")
    expect(state.message).toContain("20 Help messages")
  })
})
