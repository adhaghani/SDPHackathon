"use client"

import { useState } from "react"
import { CalendarIcon, Clock3Icon } from "lucide-react"

import { Calendar } from "@workspace/ui/components/calendar"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { toIsoDate } from "@/components/forms/date-field"

function parseDateTime(value: string | undefined): { date?: Date; time: string } {
  if (!value) return { time: "09:00" }
  const [dateValue = "", timeValue] = value.split("T")
  const [year, month, day] = dateValue.split("-").map(Number)
  return {
    date: year && month && day ? new Date(year, month - 1, day, 12) : undefined,
    time: timeValue?.slice(0, 5) || "09:00",
  }
}

export function DateTimeField({
  id,
  name,
  label,
  defaultValue,
  required = false,
  error,
}: {
  id: string
  name: string
  label: string
  defaultValue?: string
  required?: boolean
  error?: string
}) {
  const initial = parseDateTime(defaultValue)
  const [date, setDate] = useState<Date | undefined>(initial.date)
  const [time, setTime] = useState(initial.time)

  const formatted = date
    ? new Intl.DateTimeFormat("en-MY", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
    : "Choose a date"

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                id={id}
                type="button"
                variant="outline"
                className="w-full justify-start gap-2 text-left font-normal"
              >
                <CalendarIcon data-icon="inline-start" />
                {formatted}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={(value) => setDate(value ?? undefined)} />
          </PopoverContent>
        </Popover>
        <div className="relative">
          <Clock3Icon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            aria-label={`${label} time`}
            className="h-11 rounded-[16px] pl-9"
          />
        </div>
      </div>
      <input
        type="hidden"
        name={name}
        value={date ? `${toIsoDate(date)}T${time}` : ""}
        required={required}
      />
      <FieldError>{error}</FieldError>
    </Field>
  )
}
