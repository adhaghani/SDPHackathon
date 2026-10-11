export type RewardRule = {
  township_id: string | null
  action_type: string
  category_slug: string | null
  points: number
  daily_cap?: number | null
  weekly_cap?: number | null
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
