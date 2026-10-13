import "server-only"

import { deterministicAdminSummary } from "@/lib/ai-search"

import { fallbackSuggestion, parseListingSuggestion, type ListingSuggestion } from "./item-suggest"
import { openAICompletion } from "./openai"
import { redactPersonalData, safeSystemPrompt } from "./privacy"

export type { ListingSuggestion }

function aiConfig() {
  const apiKey = process.env.AI_API_KEY
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase()
  if (!apiKey || provider !== "openai") return null
  return { apiKey, provider }
}

async function complete(
  system: string,
  prompt: string,
  imageDataUrl?: string
): Promise<string | null> {
  const config = aiConfig()
  if (!config) return null
  try {
    return await openAICompletion({
      apiKey: config.apiKey,
      system: safeSystemPrompt(system),
      prompt: redactPersonalData(prompt),
      imageDataUrl,
    })
  } catch {
    return null
  }
}

export async function generateAdminSummary(
  metrics: Record<string, number | string>
): Promise<{ text: string; source: "ai" | "deterministic" }> {
  const fallback = {
    text: deterministicAdminSummary(metrics),
    source: "deterministic" as const,
  }
  const text = await complete(
    "You summarize aggregate township metrics only. Never invent resident-level details or causal claims.",
    `Summarize these aggregate metrics for a township planner: ${JSON.stringify(metrics)}`
  )
  return text ? { text, source: "ai" } : fallback
}

export async function suggestListingFromPhoto(
  imageDataUrl: string,
  fileName: string
): Promise<ListingSuggestion> {
  const fallback = fallbackSuggestion(fileName)
  if (!aiConfig()) return fallback
  const text = await complete(
    "You help list a household item for a community lending app. Return only JSON with keys title, category, estimated_value_rm, condition, description. Category must be one of home-tools, cleaning, events, sports, kids, kitchen. Condition must be like_new, good, or fair.",
    "Infer a neutral listing for the photographed item. Do not mention people, locations, documents, screens, addresses or any personal details visible in the image.",
    imageDataUrl
  )
  return (text && parseListingSuggestion(text)) || fallback
}

export type HelpArticleContext = {
  id?: string
  slug?: string
  title: string
  body: string
}

export async function generateHelpAnswer(
  question: string,
  articles: HelpArticleContext[],
  bookingStatuses: string[] = []
): Promise<string | null> {
  if (!articles.length) return null
  const statusContext = Array.from(new Set(bookingStatuses)).slice(0, 6).join(", ")
  const articleContext = articles
    .slice(0, 3)
    .map((article, index) => `[${index + 1}] ${article.title}\n${article.body}`)
    .join("\n\n")
  const text = await complete(
    "Answer BorrowLah how-to questions ONLY from the supplied help articles. Cite article titles in the answer. Never invent features, people, locations or account details. If the articles do not answer the question, say so and list the closest articles.",
    `Question: ${question}\n\nCurrent booking statuses, context only: ${statusContext || "none"}\n\nHelp articles:\n${articleContext}`
  )
  return text || null
}
