// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
import { openAICompletion } from "@/lib/ai/openai"

afterEach(() => vi.unstubAllGlobals())

describe("MiMo Chat Completions transport", () => {
  it.each([false, true])("sends configured model, system prompt and image=%s", async (withImage) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: "chat-test", object: "chat.completion", created: 1, model: "mimo-v2.6-flash",
      choices: [{ index: 0, message: { role: "assistant", content: "A useful answer." }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }), { headers: { "content-type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)
    const text = await openAICompletion({
      apiKey: "test-key", modelId: "mimo-v2.6-flash",
      baseURL: "https://api.xiaomimimo.com/v1", chatCompletions: true,
      system: "Scenario instructions", prompt: "Describe the item",
      ...(withImage ? { imageDataUrl: "data:image/png;base64,AA==" } : {}),
    })
    expect(text).toBe("A useful answer.")
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>
    const call = calls.find(([url]) => String(url).endsWith("/chat/completions"))
    expect(call?.[0]).toBe("https://api.xiaomimimo.com/v1/chat/completions")
    const body = JSON.parse(call![1].body as string)
    expect(body.model).toBe("mimo-v2.6-flash")
    expect(body.messages[0]).toEqual({ role: "system", content: "Scenario instructions" })
    if (withImage) {
      expect(body.messages[1].content).toContainEqual({ type: "image_url", image_url: { url: "data:image/png;base64,AA==" } })
    }
  })
})
