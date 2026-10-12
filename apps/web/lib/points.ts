export type RewardRule = {
  township_id: string | null
  action_type: string
  category_slug: string | null
  points: number
  reason_template?: string
  daily_cap?: number | null
  weekly_cap?: number | null
}

export const POINT_RULES = {
  event_attendance: "Verified event check-in",
  item_lent_completed: "Return confirmed by both sides",
  item_returned_on_time: "Returned on time and confirmed",
  event_hosted: "Event completed with at least three verified attendees",
  help_completed: "Help completed and confirmed",
  event_volunteer: "Volunteer hours verified by event staff",
  item_request_fulfilled: "Request fulfilled and confirmed by both sides",
  item_guide_added: "How-to guide added to an item",
  streak_milestone_3: "Three-month sharing streak reached",
  streak_milestone_6: "Six-month sharing streak reached",
  streak_milestone_12: "Twelve-month sharing streak reached",
  invite_accepted: "Neighbour joined and completed a first borrow",
  neighbour_of_month: "Selected as Neighbour of the month",
} as const satisfies Record<string, string>

export type PointActionType = keyof typeof POINT_RULES

export function pointReason(actionType: string, delta: number): string {
  const reason = POINT_RULES[actionType as PointActionType] ?? "Verified township activity"
  return `${delta} BP · ${reason}`
}

export function resolveRewardRule(
  rules: RewardRule[],
  actionType: string,
  categorySlug: string | null = null
): RewardRule | null {
  const candidates = rules.filter(
    (rule) =>
      rule.action_type === actionType &&
      (rule.category_slug === null || rule.category_slug === categorySlug)
  )

  return (
    [...candidates].sort((left, right) => {
      const leftScore = (left.category_slug ? 2 : 0) + (left.township_id ? 1 : 0)
      const rightScore = (right.category_slug ? 2 : 0) + (right.township_id ? 1 : 0)
      return rightScore - leftScore
    })[0] ?? null
  )
}

export function canAwardWithCaps({
  dailyCap,
  weeklyCap,
  dailyCount,
  weeklyCount,
}: {
  dailyCap?: number | null
  weeklyCap?: number | null
  dailyCount: number
  weeklyCount: number
}): boolean {
  if (dailyCap != null && dailyCount >= dailyCap) return false
  if (weeklyCap != null && weeklyCount >= weeklyCap) return false
  return true
}

export function levelForPoints(
  levels: Array<{ level: number; name: string; min_lifetime_points: number }>,
  lifetimePoints: number
) {
  return (
    [...levels]
      .sort((left, right) => right.min_lifetime_points - left.min_lifetime_points)
      .find((level) => lifetimePoints >= level.min_lifetime_points) ?? levels[0]
  )
}
