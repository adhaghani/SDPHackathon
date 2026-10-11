export type RecommendationInput = {
  eventId: string
  title: string
  categorySlug: string
  neighbourhoodId?: string | null
  startsAt: string
  interests: string[]
  pastCategories: string[]
  userNeighbourhoodId?: string | null
}

export type RecommendationResult<T> = {
  item: T
  score: number
  reason: string
}

export function recommendEvents<T extends RecommendationInput>(
  events: T[],
  limit = 3
): RecommendationResult<T>[] {
  return events
    .map((event) => {
      let score = 0
      const reasons: string[] = []
      if (event.pastCategories.includes(event.categorySlug)) {
        score += 3
        reasons.push(`Because you joined a ${event.categorySlug.replace("-", " ")} activity`)
      }
      if (event.interests.some((interest) => event.categorySlug.includes(interest))) {
        score += 2
        reasons.push("Because it matches one of your interests")
      }
      if (event.userNeighbourhoodId && event.neighbourhoodId === event.userNeighbourhoodId) {
        score += 2
        reasons.push("Because it is in your neighbourhood")
      }
      const hour = new Date(event.startsAt).getHours()
      if (hour >= 18) {
        score += 1
        reasons.push("Because it is an evening activity")
      }
      return { item: event, score, reason: reasons[0] ?? "Because it is happening soon" }
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
}

export function recommendItems<T extends {
  itemId: string
  title: string
  categorySlug: string
  neighbourhoodId?: string | null
  interests: string[]
  pastCategories: string[]
  userNeighbourhoodId?: string | null
}>(
  items: T[],
  limit = 3
): RecommendationResult<T>[] {
  return items
    .map((item) => {
      let score = 0
      const reasons: string[] = []
      if (item.pastCategories.includes(item.categorySlug)) {
        score += 3
        reasons.push(`Because you have borrowed ${item.categorySlug.replace("-", " ")} before`)
      }
      if (item.interests.some((interest) => item.categorySlug.includes(interest))) {
        score += 2
        reasons.push("Because it matches one of your interests")
      }
      if (item.userNeighbourhoodId && item.neighbourhoodId === item.userNeighbourhoodId) {
        score += 2
        reasons.push("Because it is in your neighbourhood")
      }
      return { item, score, reason: reasons[0] ?? "Because it is useful right now" }
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
}
