export type ListingSuggestion = {
  title: string
  categorySlug: string
  estimatedValueRm: number | null
  condition: "like_new" | "good" | "fair"
  description: string
  source: "ai" | "fallback"
}

const CATEGORY_SLUGS = [
  "home-tools",
  "cleaning",
  "events",
  "sports",
  "kids",
  "kitchen",
]

export function fallbackSuggestion(fileName: string): ListingSuggestion {
  const cleaned = fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
  return {
    title: cleaned.length >= 3 ? cleaned : "",
    categorySlug: "",
    estimatedValueRm: null,
    condition: "good",
    description: "",
    source: "fallback",
  }
}

export function parseListingSuggestion(value: string): ListingSuggestion | null {
  try {
    const start = value.indexOf("{")
    const end = value.lastIndexOf("}")
    if (start < 0 || end <= start) return null
    const parsed = JSON.parse(value.slice(start, end + 1)) as Record<string, unknown>
    const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 100) : ""
    if (!title) return null
    const categorySlug =
      typeof parsed.category === "string" && CATEGORY_SLUGS.includes(parsed.category)
        ? parsed.category
        : ""
    const estimated = typeof parsed.estimated_value_rm === "number"
      ? parsed.estimated_value_rm
      : NaN
    const condition =
      parsed.condition === "like_new" || parsed.condition === "fair"
        ? parsed.condition
        : "good"
    return {
      title,
      categorySlug,
      estimatedValueRm: Number.isFinite(estimated) && estimated >= 0 ? estimated : null,
      condition,
      description:
        typeof parsed.description === "string" ? parsed.description.trim().slice(0, 1200) : "",
      source: "ai",
    }
  } catch {
    return null
  }
}
