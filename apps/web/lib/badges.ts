export const BADGE_ACTIONS = {
  event_attendance: "Event check-ins",
  event_hosted: "Completed events hosted",
  event_volunteer: "Verified volunteering",
  item_lent_completed: "Completed lends",
  item_returned_on_time: "On-time returns",
  help_completed: "Confirmed help",
  giveaway_given: "Completed giveaways given",
  giveaway_taken: "Completed giveaways received",
  challenge_completed: "Completed challenges",
  recycling_goal_completed: "Completed recycling goals",
  item_guide_added: "Item guides added",
  item_request_fulfilled: "Item requests fulfilled",
  invite_accepted: "Verified neighbour invites",
} as const

export type BadgeCriteria = {
  type: string
  threshold?: number
  action_types?: string[]
  action_type?: string
  min_types?: number
  min_active_weeks?: number
  window_weeks?: number
  metadata?: Record<string, unknown>
}

export type BadgeProgress = {
  type: string
  percent: number | null
  eligible: boolean
  requirements: Array<{ current: number; target: number; label: string }>
  note?: string
}

export type BadgeDefinition = {
  slug: string
  name: string
  description: string
  icon: string
  criteria: BadgeCriteria
}

export function badgeRequirements(criteria?: BadgeCriteria | null): string {
  if (!criteria) return "The original earning requirements aren’t available."
  const target = criteria.threshold ?? 1
  switch (criteria.type) {
    case "count": {
      const activities = (criteria.action_types ?? [])
        .map(
          (action) =>
            BADGE_ACTIONS[action as keyof typeof BADGE_ACTIONS] ??
            action.replaceAll("_", " ")
        )
        .join(" or ")
      return `Complete ${target} qualifying activities: ${activities}.${criteria.metadata?.counts_as_sustainability === true ? " Only activities marked as sustainability count." : ""}`
    }
    case "streak":
      return `Complete at least one borrow or lend in each of ${target} consecutive calendar months. Sharing streaks include your activity across townships.`
    case "consecutive_recent":
      return `Complete ${target} consecutive on-time returns. A return without an on-time credit resets the run. Borrowing history across townships counts.`
    case "sustained":
      return `Take part in ${criteria.min_types ?? 3} different activity types across ${criteria.min_active_weeks ?? 6} active weeks in the last ${criteria.window_weeks ?? 12} weeks.`
    case "manual":
      return "Selected by the township office for verified helpful action. This badge is not earned automatically."
    default:
      return "Ask the township office about this award’s earning requirements."
  }
}
