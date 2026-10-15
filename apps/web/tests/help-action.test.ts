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
  it("saves the answer and supplies only earlier messages as follow-up context", async () => {
    const history = [{ id: "old-question", role: "user", content: "How do I borrow?" }, { id: "old-answer", role: "assistant", content: "Choose dates." }]
    mocks.generateHelpAnswer.mockResolvedValue("Arrange pickup after approval.")
    const rpc = vi.fn(async (name: string) => {
      if (name === "send_help_message") return { error: null, data: {
        conversation_id: "conversation-1", message_id: "current-question",
        articles: [{ id: "guide", slug: "borrow", title: "Borrowing", body: "Arrange pickup.", category: "borrowing" }],
        messages: [...history, { id: "current-question", role: "user", content: "What next?" }],
      } }
      if (name === "save_help_answer") return { error: null, data: { id: "saved-answer", role: "assistant", content: "Arrange pickup after approval.", source: "ai" } }
      return { error: null, data: [] }
    })
    mocks.createClient.mockResolvedValue({ rpc })
    const form = new FormData()
    form.set("question", "What next?")
    const state = await askHelp({ status: "idle" }, form)
    expect(mocks.generateHelpAnswer).toHaveBeenCalledWith("What next?", expect.any(Array), [], history)
    expect(rpc).toHaveBeenCalledWith("save_help_answer", { p_message_id: "current-question", p_answer: "Arrange pickup after approval.", p_source: "ai" })
    expect(state.messages).toHaveLength(4)
    expect(state.messages?.[3]?.id).toBe("saved-answer")
  })

  it("gives useful article guidance when AI is unavailable", async () => {
    mocks.generateHelpAnswer.mockResolvedValue(null)
    mocks.createClient.mockResolvedValue({ rpc: vi.fn(async (name: string) => name === "send_help_message" ? { error: null, data: {
      articles: [{ id: "guide", slug: "borrow", title: "How to borrow", body: "Choose dates and send a request.", category: "borrowing" }], messages: [],
    } } : { error: null, data: [] }) })
    const form = new FormData()
    form.set("question", "How do I borrow?")
    const state = await askHelp({ status: "idle" }, form)
    expect(state.answer).toContain("Choose dates and send a request.")
    expect(state.messages?.[0]?.role).toBe("assistant")
  })

})
