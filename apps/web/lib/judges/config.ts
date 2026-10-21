/** Enable only in the judges-preview deployment, never in production. */
export function isJudgesPreview() {
  return process.env.NEXT_PUBLIC_JUDGES_PREVIEW === "true"
}

export const judgeRoles = [
  {
    id: "resident",
    name: "Resident",
    person: "Aisyah",
    summary:
      "Borrow from a neighbour, join an event, and explore community rewards.",
    task: "Try a complete borrowing journey",
    color: "sky",
  },
  {
    id: "manager",
    name: "Township manager",
    person: "Township office",
    summary:
      "See township participation, review requests, and explore planning signals.",
    task: "Review a resident membership",
    color: "lime",
  },
  {
    id: "guard",
    name: "Guard",
    person: "Gate team",
    summary:
      "Look up a visitor pass and simulate arrival and departure at the gate.",
    task: "Check in a sample visitor",
    color: "mustard",
  },
  {
    id: "event",
    name: "Event organiser",
    person: "Raj",
    summary:
      "Manage a community event, find attendees, and record sample attendance.",
    task: "Check in an event attendee",
    color: "paper",
  },
] as const

export type JudgeRole = (typeof judgeRoles)[number]["id"]
export function isJudgeRole(value: string): value is JudgeRole {
  return judgeRoles.some((role) => role.id === value)
}
