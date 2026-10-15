export type HelpArticle = {
  id: string
  slug: string
  title: string
  body: string
  category: string
}

export type HelpMessage = {
  id?: string
  role: string
  content: string
  created_at?: string
  source?: "ai" | "articles" | null
}

export function articleFallbackAnswer(articles: HelpArticle[]): string {
  const first = articles[0]
  if (!first)
    return "I couldn't find guidance for that question. Try describing what you want to do, or use Talk to an organiser for help."
  return `${first.body}\n\nYou can read more in “${first.title}” below.`
}
