import type { StationName } from "@/components/shared/township-line"

const activityLabels: Record<string, string> = {
  event_attendance: "Checked in at an event",
  event_hosted: "Hosted a completed event",
  event_volunteer: "Volunteer hours verified",
  item_lent_completed: "Lend completed and confirmed",
  item_returned_on_time: "Returned a borrow on time",
  help_completed: "Helped a neighbour, confirmed",
  giveaway_given: "Passed something on",
  giveaway_taken: "Received a neighbour giveaway",
  challenge_completed: "Challenge completed",
  recycling_goal_completed: "Township recycling goal completed",
  recycling_guide_completed: "Completed the recycling guide",
  redemption: "Redeemed a reward",
  reversal: "Points adjusted by the township",
}

const activityLines: Record<string, StationName | "Reward"> = {
  item_lent_completed: "Pinjam",
  item_returned_on_time: "Pinjam",
  event_attendance: "Jom",
  event_hosted: "Jom",
  event_volunteer: "Jom",
  help_completed: "Tolong",
  giveaway_given: "Tolong",
  giveaway_taken: "Tolong",
  challenge_completed: "Rimba",
  recycling_goal_completed: "Rimba",
  recycling_guide_completed: "Rimba",
  redemption: "Reward",
}

export function describeActivity(actionType: string): string {
  return activityLabels[actionType] ?? actionType.replaceAll("_", " ")
}

export function activityLine(
  actionType: string
): StationName | "Reward" | "Township" {
  return activityLines[actionType] ?? "Township"
}

const dayFormat = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  weekday: "short",
})
const dateFormat = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  day: "numeric",
  month: "short",
})
const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
})

/** "Today", "Yesterday", a weekday within the last week, otherwise "12 Oct". */
export function formatRelativeDay(
  value: string | Date,
  now = new Date()
): string {
  const date = new Date(value)
  const days = Math.round(
    (Date.parse(dayKey.format(now)) - Date.parse(dayKey.format(date))) /
      86_400_000
  )
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days > 1 && days < 7) return dayFormat.format(date)
  return dateFormat.format(date)
}

/** Malay greeting by Malaysia time of day. */
export function malayGreeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now)
  )
  if (hour < 12) return "Selamat pagi"
  if (hour < 15) return "Selamat tengah hari"
  if (hour < 19) return "Selamat petang"
  return "Selamat malam"
}

export function levelProgress(
  lifetime: number,
  levels: ReadonlyArray<{
    level: number
    name: string
    min_lifetime_points: number
  }>
) {
  const sorted = [...levels].sort(
    (a, b) => a.min_lifetime_points - b.min_lifetime_points
  )
  const current =
    [...sorted]
      .reverse()
      .find((level) => lifetime >= level.min_lifetime_points) ?? sorted[0]
  const next = sorted.find((level) => level.min_lifetime_points > lifetime)
  const floor = current?.min_lifetime_points ?? 0
  const percent = next
    ? Math.min(
        100,
        Math.round(
          ((lifetime - floor) / (next.min_lifetime_points - floor)) * 100
        )
      )
    : 100
  return {
    current,
    next,
    toNext: next ? next.min_lifetime_points - lifetime : 0,
    percent,
  }
}
