import type { JudgeRole } from "./config"
import type { PreviewState } from "./seed"

export const previewTasks = [
  "borrow",
  "events",
  "recycling",
  "rewards",
  "review",
] as const
export type PreviewTask = (typeof previewTasks)[number]
export function parsePreviewTask(value: unknown): PreviewTask | undefined {
  return typeof value === "string" &&
    previewTasks.some((task) => task === value)
    ? (value as PreviewTask)
    : undefined
}

export function getDemoJourney(state: PreviewState) {
  return [
    {
      id: "borrow",
      title: "Complete a neighbour’s loan",
      detail: "Resident · Request, collect, and return an item.",
      href: "/preview/resident?task=borrow",
      done: Object.values(state.bookings).some((step) => step === 6),
    },
    {
      id: "rsvp",
      title: "Join the garden morning",
      detail: "Resident · Add Aisyah to the sample guest list.",
      href: "/preview/resident?task=events",
      done: state.rsvp,
    },
    {
      id: "attendance",
      title: "Welcome Aisyah to the event",
      detail: "Organiser · See the RSVP arrive, then check her in.",
      href: state.rsvp ? "/preview/event" : "/preview/resident?task=events",
      done: state.rsvp && state.checkedIn.includes("aisyah"),
    },
    {
      id: "visitor",
      title: "Try a visitor’s arrival and departure",
      detail: "Guard · Look up DEMO-1024 and complete the visit.",
      href: "/preview/guard",
      done: state.departures.length > 0,
    },
    {
      id: "review",
      title: "Review a new neighbour",
      detail: "Manager · Approve or decline a sample membership.",
      href: "/preview/manager?task=review",
      done: state.membership !== "pending",
    },
  ]
}

export const bookingGuidance = [
  {
    actor: "You · Aisyah, borrower",
    text: "Ask the owner for the sample dates. A request does not mean the item has been handed over.",
  },
  {
    actor: "Simulating the lender",
    text: "The owner would review the request in the live app. Here, you can try that decision on their behalf.",
  },
  {
    actor: "You · Aisyah, borrower",
    text: "Confirm you collected the item at the community hub. The lender still needs to confirm.",
  },
  {
    actor: "Simulating the lender",
    text: "Confirm the owner handed the item to Aisyah. Both sides must agree before the loan is marked as collected.",
  },
  {
    actor: "You · Aisyah, borrower",
    text: "Mark the item as returned. The loan stays open until the lender confirms the return.",
  },
  {
    actor: "Simulating the lender",
    text: "Confirm the item is back with its owner. This closes the sample loan; no real points are issued.",
  },
] as const

export type DemoActivity = {
  id: string
  message: string
  role: JudgeRole
  at: number
}
