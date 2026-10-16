import "server-only"

import { deterministicAdminSummary } from "@/lib/ai-search"

import {
  fallbackGiveawaySuggestion,
  parseGiveawaySuggestion,
  type GiveawaySuggestion,
} from "./giveaway-suggest"
import { fallbackSuggestion, parseListingSuggestion, type ListingSuggestion } from "./item-suggest"
import { openAICompletion } from "./openai"
import { redactPersonalData, safeSystemPrompt } from "./privacy"
import { AI_PROMPTS } from "./prompts"

export type { GiveawaySuggestion, ListingSuggestion }

function aiConfig() {
  const apiKey = process.env.AI_API_KEY?.trim()
  const provider = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase()
  const mimo = ["mimo", "xiaomi", "xiaomi mimo"].includes(provider)
  if (!apiKey || (!mimo && provider !== "openai")) return null
  return {
    apiKey,
    modelId: process.env.AI_MODEL?.trim() || (mimo ? "mimo-v2.6-flash" : "gpt-4o-mini"),
    baseURL: process.env.AI_PROVIDER_LINK?.trim() || (mimo ? "https://api.xiaomimimo.com/v1" : undefined),
    chatCompletions: mimo,
  }
}

async function complete(
  system: string,
  prompt: string,
  imageDataUrl?: string
): Promise<string | null> {
  const config = aiConfig()
  if (!config) return null
  try {
    const text = await openAICompletion({
      ...config,
      system: safeSystemPrompt(system),
      prompt: redactPersonalData(prompt),
      imageDataUrl,
    })
    return text.trim() ? redactPersonalData(text.trim()) : null
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
    AI_PROMPTS.adminSummary,
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
    AI_PROMPTS.photoListing,
    "Infer a neutral listing for the photographed item. Do not mention people, locations, documents, screens, addresses or any personal details visible in the image.",
    imageDataUrl
  )
  return (text && parseListingSuggestion(text)) || fallback
}

export async function suggestGiveawayFromPhoto(
  imageDataUrl: string,
  fileName: string
): Promise<GiveawaySuggestion> {
  const fallback = fallbackGiveawaySuggestion(fileName)
  if (!aiConfig()) return fallback
  const text = await complete(
    AI_PROMPTS.giveawayPhoto,
    "Draft a free giveaway listing for the photographed item. Do not mention people, locations, documents, screens, addresses or any personal details visible in the image.",
    imageDataUrl
  )
  return (text && parseGiveawaySuggestion(text)) || fallback
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
  bookingStatuses: string[] = [],
  history: Array<{ role: string; content: string }> = []
): Promise<string | null> {
  if (!articles.length) return null
  const statusContext = Array.from(new Set(bookingStatuses)).slice(0, 6).join(", ")
  const articleContext = articles
    .slice(0, 8)
    .map((article, index) => `[${index + 1}] ${article.title}\n${article.body}`)
    .join("\n\n")
  const text = await complete(
    AI_PROMPTS.help,
    `Question: ${question}\n\nRecent conversation, context only (previous answers are not authoritative): ${JSON.stringify(history.filter((message) => ["user", "assistant"].includes(message.role)).slice(-8).map((message) => ({ role: message.role, content: message.content.slice(0, 1500) })))}\n\nCurrent booking statuses, context only: ${statusContext || "none"}\n\nHelp articles:\n${articleContext}`
  )
  return text || null
}
