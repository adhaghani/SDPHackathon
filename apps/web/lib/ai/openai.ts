import "server-only"

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export type AICompletionRequest = {
  apiKey: string
  system: string
  prompt: string
  imageDataUrl?: string
}

export async function openAICompletion({
  apiKey,
  system,
  prompt,
  imageDataUrl,
}: AICompletionRequest): Promise<string> {
  const provider = createOpenAI({ apiKey })
  const model = provider("gpt-4o-mini")
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
  })
  return result.text
}
