const malaysiaDate = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
})

const malaysiaTime = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
})

export function formatEventDate(value: string | Date): string {
  return malaysiaDate.format(new Date(value))
}

export function formatEventTime(value: string | Date): string {
  return malaysiaTime.format(new Date(value))
}

export function formatEventRange(start: string | Date, end: string | Date): string {
  return `${formatEventDate(start)} · ${formatEventTime(start)}–${formatEventTime(end)}`
}

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0)
  return `RM ${amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
