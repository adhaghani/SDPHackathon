import "server-only"

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export type AICompletionRequest = {
  apiKey: string
  modelId?: string
  baseURL?: string
  chatCompletions?: boolean
  system: string
  prompt: string
  imageDataUrl?: string
}

export async function openAICompletion({
  apiKey,
  modelId = "gpt-4o-mini",
  baseURL,
  chatCompletions = false,
  system,
  prompt,
  imageDataUrl,
}: AICompletionRequest): Promise<string> {
  const provider = createOpenAI({ apiKey, baseURL })
  const model = chatCompletions ? provider.chat(modelId) : provider(modelId)
  const content = imageDataUrl
    ? [
        { type: "text" as const, text: prompt },
        { type: "image" as const, image: imageDataUrl },
      ]
    : prompt
  const result = await generateText({
    model,
    system,
    messages: [{ role: "user", content }],
    temperature: 0.2,
    maxOutputTokens: 2048,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(30_000),
  })
  return result.text
}
