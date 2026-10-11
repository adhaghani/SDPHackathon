export type NaturalLanguageSearch = {
  category?: string
  query: string
  weekendOnly: boolean
  kidsOnly: boolean
  freeOnly: boolean
}

export function parseNaturalLanguageSearch(input: string): NaturalLanguageSearch {
  const query = input.trim()
  const lower = query.toLowerCase()
  const category = lower.includes("kids") || lower.includes("children")
    ? "kids"
    : lower.includes("clean") || lower.includes("garden")
      ? "home-tools"
      : lower.includes("sport") || lower.includes("badminton")
        ? "sports"
        : lower.includes("kitchen") || lower.includes("host")
          ? "kitchen"
          : undefined

  return {
    category,
    query,
    weekendOnly: lower.includes("weekend") || lower.includes("saturday") || lower.includes("sunday"),
    kidsOnly: lower.includes("kids") || lower.includes("children"),
    freeOnly: lower.includes("free") || lower.includes("no deposit"),
  }
}

export function deterministicAdminSummary(metrics: Record<string, number | string>): string {
  const active = Number(metrics.active_residents ?? 0)
  const borrows = Number(metrics.completed_borrowing_transactions ?? 0)
  const reuse = Number(metrics.items_reused ?? 0)
  const attendance = Number(metrics.repeat_event_attendance ?? 0)
  const lines = [
    `Observed period activity includes ${active} active residents and ${borrows} completed borrows.`,
    `Reuse signal: ${reuse} distinct items reached a completed loan.`,
    `Repeat attendance signal: ${attendance} residents attended at least two checked-in events.`,
  ]
  if (active < 5) lines.push("The active-resident sample is small; treat planning conclusions cautiously.")
  if (borrows === 0) lines.push("No completed borrows were observed in this period.")
  return lines.join(" ")
}
