import { formatEventDate } from "@/lib/format"

type BookingWindow = {
  start_date: string
  end_date: string
}

export function AvailabilityCalendar({
  bookings,
  maxLoanDays,
}: {
  bookings: BookingWindow[]
  maxLoanDays: number
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    const iso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
    const booked = bookings.some((booking) => iso >= booking.start_date && iso <= booking.end_date)
    return { iso, booked, label: formatEventDate(iso).replace(/ \d{4}$/, "") }
  })

  return (
    <section aria-labelledby="availability-calendar-heading" className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="availability-calendar-heading" className="text-title text-ink">Next two weeks</h2>
        <span className="text-sm text-ink-muted">Maximum loan: {maxLoanDays} days</span>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <li
            key={day.iso}
            className={`min-h-16 rounded-lg p-2 text-center text-xs ${day.booked ? "bg-coral-tint text-ink" : "bg-mint-tint text-ink"}`}
          >
            <span className="block font-bold tabular-nums">{day.label}</span>
            <span className="mt-1 block">{day.booked ? "Booked" : "Open"}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
