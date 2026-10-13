"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@workspace/ui/components/calendar"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day, 12)
}

function formatValue(date: Date | undefined): string {
  if (!date) return "Choose a date"
  return new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function DateField({
  id,
  name,
  label,
  defaultValue,
  required = false,
  error,
  minDate,
}: {
  id: string
  name: string
  label: string
  defaultValue?: string
  required?: boolean
  error?: string
  minDate?: Date
}) {
  const [date, setDate] = useState<Date | undefined>(() => parseIsoDate(defaultValue))

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
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
              {formatValue(date)}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(value) => setDate(value ?? undefined)}
            disabled={minDate ? { before: minDate } : undefined}          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={date ? toIsoDate(date) : ""} required={required} />
      <FieldError>{error}</FieldError>
    </Field>
  )
}
