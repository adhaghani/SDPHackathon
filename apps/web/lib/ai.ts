import "server-only"

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

import { deterministicAdminSummary } from "@/lib/ai-search"

export async function generateAdminSummary(
  metrics: Record<string, number | string>
): Promise<{ text: string; source: "ai" | "deterministic" }> {
  const fallback = { text: deterministicAdminSummary(metrics), source: "deterministic" as const }
  if (!process.env.AI_API_KEY) return fallback

  try {
    const provider = createOpenAI({ apiKey: process.env.AI_API_KEY })
    const result = await generateText({
      model: provider("gpt-4o-mini"),
      system: "You summarize aggregate township metrics only. Never invent resident-level details or causal claims.",
      prompt: `Summarize these aggregate metrics for a township planner: ${JSON.stringify(metrics)}`,
      temperature: 0.2,
    })
    return { text: result.text || fallback.text, source: "ai" }
  } catch {
    return fallback
  }
}
