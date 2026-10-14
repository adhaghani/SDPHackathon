"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@workspace/ui/components/calendar"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { toIsoDate } from "@/components/forms/date-field"
import type { Matcher } from "react-day-picker"
import { cn } from "@workspace/ui/lib/utils"

type DateRangeValue = { from?: Date; to?: Date }

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day, 12)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatValue(range: DateRangeValue): string {
  if (!range.from) return "Choose dates"
  if (!range.to || range.to.getTime() === range.from.getTime()) {
    return new Intl.DateTimeFormat("en-MY", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(range.from)
  }

  const formatter = new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${formatter.format(range.from)} – ${formatter.format(range.to)}`
}

export function DateRangeField({
  id,
  startName,
  endName,
  label,
  initialStart,
  initialEnd,
  required = false,
  startError,
  endError,
  minDate,
  maxDate,
  blockedDates = [],
  maxRangeDays,
  onChange,
}: {
  id: string
  startName: string
  endName: string
  label: string
  initialStart?: string
  initialEnd?: string
  required?: boolean
  startError?: string
  endError?: string
  minDate?: Date
  maxDate?: Date
  blockedDates?: string[]
  maxRangeDays?: number
  onChange?: (value: { start: string; end: string | null }) => void
}) {
  const [range, setRange] = useState<DateRangeValue>(() => ({
    from: parseIsoDate(initialStart),
    to: parseIsoDate(initialEnd),
  }))
  const [open, setOpen] = useState(false)
  const blocked = new Set(blockedDates)

  function update(value: DateRangeValue | undefined) {
    const next = { from: value?.from, to: value?.to }
    setRange(next)
    onChange?.({
      start: next.from ? toIsoDate(next.from) : "",
      end: next.to ? toIsoDate(next.to) : null,
    })
  }

  const disabled: Matcher[] = [
    ...Array.from(blocked, (value) => parseIsoDate(value)).filter((value): value is Date => Boolean(value)),
  ]
  if (minDate) disabled.push({ before: minDate })
  if (maxDate) disabled.push({ after: maxDate })
  if (range.from && maxRangeDays) {
    disabled.push({ after: addDays(range.from, maxRangeDays - 1) })
  }

  return (
    <Field data-invalid={Boolean(startError || endError)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start gap-2 text-left font-normal",
                (startError || endError) && "aria-invalid:border-destructive"
              )}
            >
              <CalendarIcon data-icon="inline-start" />
              {formatValue(range)}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            excludeDisabled
            selected={{ from: range.from, to: range.to }}
            onSelect={update}
            numberOfMonths={1}
            disabled={disabled}          />
        </PopoverContent>
      </Popover>
      <div className="sr-only">
        <input
          type="hidden"
          name={startName}
          value={range.from ? toIsoDate(range.from) : ""}
          required={required}
        />
        <input
          type="hidden"
          name={endName}
          value={range.to ? toIsoDate(range.to) : range.from ? toIsoDate(range.from) : ""}
          required={required}
        />
      </div>
      <FieldError>{startError ?? endError}</FieldError>
    </Field>
  )
}
