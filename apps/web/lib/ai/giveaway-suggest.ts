export type GiveawaySuggestion = {
  title: string
  categorySlug: string
  condition: "unusable" | "worn" | "good"
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

export function fallbackGiveawaySuggestion(
  fileName: string
): GiveawaySuggestion {
  const cleaned = fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)

  return {
    title: cleaned.length >= 3 ? cleaned : "",
    categorySlug: "",
    condition: "unusable",
    description: "",
    source: "fallback",
  }
}

export function parseGiveawaySuggestion(
  value: string
): GiveawaySuggestion | null {
  try {
    const start = value.indexOf("{")
    const end = value.lastIndexOf("}")
    if (start < 0 || end <= start) return null

    const parsed = JSON.parse(value.slice(start, end + 1)) as Record<
      string,
      unknown
    >
    const title =
      typeof parsed.title === "string" ? parsed.title.trim().slice(0, 120) : ""
    if (!title) return null

    const categorySlug =
      typeof parsed.category === "string" &&
      CATEGORY_SLUGS.includes(parsed.category)
        ? parsed.category
        : ""
    if (
      parsed.condition !== "unusable" &&
      parsed.condition !== "worn" &&
      parsed.condition !== "good"
    ) {
      return null
    }

    return {
      title,
      categorySlug,
      condition: parsed.condition,
      description:
        typeof parsed.description === "string"
          ? parsed.description.trim().slice(0, 1000)
          : "",
      source: "ai",
    }
  } catch {
    return null
  }
}
