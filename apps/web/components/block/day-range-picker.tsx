"use client"

import { DateRangeField } from "@/components/forms/date-range-field"

export type PickerDay = {
  iso: string
  weekday: string
  day: string
  month: string
  blocked?: boolean
}

export function DayRangePicker({
  days,
  maxLoanDays,
  startName = "startDate",
  endName = "endDate",
  onChange,
}: {
  days: PickerDay[]
  maxLoanDays: number
  startName?: string
  endName?: string
  onChange?: (value: { start: string; end: string | null }) => void
}) {
  const blockedDates = days.filter((day) => day.blocked).map((day) => day.iso)
  const availableDays = days.filter((day) => !day.blocked)

  return (
    <DateRangeField
      id="item-borrowing-dates"
      startName={startName}
      endName={endName}
      label="Borrowing dates"
      required
      blockedDates={blockedDates}
      minDate={availableDays[0]?.iso ? parseDate(availableDays[0].iso) : undefined}
      maxDate={availableDays.at(-1)?.iso ? parseDate(availableDays.at(-1)!.iso) : undefined}
      maxRangeDays={maxLoanDays}
      onChange={onChange}
    />
  )
}

function parseDate(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number)
  return new Date(year, month - 1, day, 12)
}
