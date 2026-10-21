export const items = [
  {
    id: "washer",
    name: "Pressure washer",
    owner: "Farid",
    block: "Block B",
    category: "Home & garden",
    image: "item-pressure-washer.svg",
    detail:
      "For a weekend clean-up. Hose and nozzle included. Meet at the community hub.",
  },
  {
    id: "drill",
    name: "Cordless drill",
    owner: "Mei Ling",
    block: "Block A",
    category: "Tools",
    image: "item-drill.svg",
    detail:
      "18V drill with a set of bits. A handy neighbourly loan for small home projects.",
  },
  {
    id: "cooler",
    name: "Picnic cooler",
    owner: "Kumar",
    block: "Block C",
    category: "Outdoors",
    image: "item-cooler.svg",
    detail:
      "A 28-litre cooler for a picnic or community event. Please return clean and dry.",
  },
  {
    id: "ladder",
    name: "Folding ladder",
    owner: "Siti",
    block: "Block A",
    category: "Tools",
    image: "item-ladder.svg",
    detail:
      "Compact household ladder. Collect and return at the community hub.",
  },
] as const

export const attendees = [
  { id: "aisyah", name: "Aisyah Rahman", block: "Block A", role: "Volunteer" },
  { id: "farid", name: "Farid Hassan", block: "Block B", role: "Attendee" },
  { id: "mei", name: "Mei Ling Tan", block: "Block A", role: "Volunteer" },
  { id: "kumar", name: "Kumar Raj", block: "Block C", role: "Attendee" },
  { id: "siti", name: "Siti Aminah", block: "Block A", role: "Attendee" },
] as const

export const visitors = [
  {
    code: "DEMO-1024",
    name: "Daniel Lee",
    host: "Aisyah Rahman",
    unit: "A-12-03",
    plate: "DEMO 1024",
    valid: true,
  },
  {
    code: "DEMO-2048",
    name: "Nadia Ahmad",
    host: "Farid Hassan",
    unit: "B-08-02",
    plate: "DEMO 2048",
    valid: true,
  },
  {
    code: "DEMO-EXPIRED",
    name: "Expired sample pass",
    host: "Sample host",
    unit: "C-02-01",
    plate: "DEMO 0000",
    valid: false,
  },
] as const

export const bookingSteps = [
  "Available",
  "Requested",
  "Approved",
  "Borrower confirmed pick-up",
  "Both confirmed pick-up",
  "Return marked by borrower",
  "Completed",
] as const
export const bookingActions = [
  "Request to borrow",
  "Simulate lender approval",
  "Confirm pick-up as borrower",
  "Simulate lender pick-up confirmation",
  "Mark returned as borrower",
  "Simulate lender return confirmation",
] as const

export type PreviewState = {
  version: 1
  bookings: Record<string, number>
  saved: string[]
  rsvp: boolean
  checkedIn: string[]
  inside: string[]
  departures: string[]
  membership: "pending" | "approved" | "declined"
  recycling: boolean
  redeemed: boolean
}
export const initialPreviewState: PreviewState = {
  version: 1,
  bookings: {},
  saved: [],
  rsvp: false,
  checkedIn: ["farid", "mei"],
  inside: [],
  departures: [],
  membership: "pending",
  recycling: false,
  redeemed: false,
}

export function parsePreviewState(value: string | null): PreviewState {
  if (!value) return structuredClone(initialPreviewState)
  try {
    const data = JSON.parse(value)
    const list = (x: unknown): x is string[] =>
      Array.isArray(x) && x.every((v) => typeof v === "string")
    if (
      data.version !== 1 ||
      typeof data.bookings !== "object" ||
      data.bookings === null ||
      Array.isArray(data.bookings) ||
      !Object.entries(data.bookings).every(
        ([key, step]) =>
          items.some((item) => item.id === key) &&
          Number.isInteger(step) &&
          Number(step) >= 0 &&
          Number(step) <= 6
      ) ||
      ![data.saved, data.checkedIn, data.inside, data.departures].every(list) ||
      ![data.rsvp, data.recycling, data.redeemed].every(
        (v) => typeof v === "boolean"
      ) ||
      !["pending", "approved", "declined"].includes(data.membership)
    )
      return structuredClone(initialPreviewState)
    return data as PreviewState
  } catch {
    return structuredClone(initialPreviewState)
  }
}
