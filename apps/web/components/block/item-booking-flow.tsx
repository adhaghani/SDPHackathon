"use client"

import { useMemo, useState } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"

import { requestBooking } from "@/actions/borrow"
import { ActionDock } from "@/components/block/action-dock"
import { DayRangePicker } from "@/components/block/day-range-picker"

const idleState = { status: "idle" } as const

type BookingWindow = { start_date: string; end_date: string }

export function ItemBookingFlow({
  itemId,
  handoverOptions,
  maxLoanDays,
  bookings,
  isOwner,
}: {
  itemId: string
  handoverOptions: string[]
  maxLoanDays: number
  bookings: BookingWindow[]
  isOwner: boolean
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(requestBooking, idleState)
  const [range, setRange] = useState<{
    start: string
    end: string | null
  } | null>(null)

  const days = useMemo(() => {
    const formatDay = new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    return Array.from({ length: 10 }, (_, index) => {
      const date = new Date()
      date.setHours(12, 0, 0, 0)
      date.setDate(date.getDate() + index)
      const iso = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
      const parts = formatDay.formatToParts(date)
      const value = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? ""
      return {
        iso,
        weekday: value("weekday"),
        day: value("day"),
        month: value("month"),
        blocked: bookings.some(
          (booking) => iso >= booking.start_date && iso <= booking.end_date
        ),
      }
    })
  }, [bookings])

  const startDate = parseIsoDate(range?.start)
  const endDate = parseIsoDate(range?.end)
  const selectedLabel = startDate
    ? `${shortDate(startDate)}${endDate && endDate.getTime() !== startDate.getTime() ? ` – ${shortDate(endDate)}` : ""}`
    : "Choose your dates"
  const selectedDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.round((endDate.getTime() - startDate.getTime()) / 86_400000) + 1
        )
      : startDate
        ? 1
        : 0

  return (
    <form
      id="item-booking-form"
      action={action}
      className="flex flex-col gap-[22px]"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input
        type="hidden"
        name="handoverMethod"
        value={handoverOptions[0] ?? "Meet in a shared space"}
      />
      <section aria-labelledby="dates-heading">
        <h2 id="dates-heading" className="text-[15px] leading-5 font-bold">
          When do you need it?
        </h2>
        <div className="mt-2.5">
          <DayRangePicker
            days={days}
            maxLoanDays={maxLoanDays}
            onChange={(value) => setRange(value)}
          />
        </div>
      </section>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-[16px] bg-tomato p-3 text-sm text-ink"
              : "rounded-[16px] bg-lime p-3 text-sm text-ink"
          }
        >
          {state.message}
          {state.status === "success" && state.bookingId ? (
            <button
              type="button"
              className="ml-2 font-bold underline underline-offset-4"
              onClick={() => router.push(`/borrow/bookings/${state.bookingId}`)}
            >
              Open booking
            </button>
          ) : null}
        </p>
      ) : null}

      {isOwner ? (
        <p className="rounded-[18px] bg-sky p-4 text-sm font-semibold text-ink">
          This is your listing. Requests will appear in My listings.
        </p>
      ) : (
        <ActionDock
          title={selectedLabel}
          subtitle={
            selectedDays
              ? `${selectedDays} ${selectedDays === 1 ? "day" : "days"} · ${Number(selectedDays) > 0 ? "Free to request" : "Select dates"}`
              : "Free · choose a range"
          }
          actionLabel="Request"
          disabled={!startDate}
          pending={pending}
          formId="item-booking-form"
        />
      )}
    </form>
  )
}

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const year = Number(iso.slice(0, 4))
  const month = Number(iso.slice(5, 7))
  const day = Number(iso.slice(8, 10))
  const calendarDate = new Date(Date.UTC(year, month - 1, day))
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null
  }

  return new Date(`${iso}T12:00:00+08:00`)
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date)
}
