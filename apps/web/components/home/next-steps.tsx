import Link from "next/link"
import { bookingNextStep, type NextBooking } from "@/lib/home"
import { formatEventDate, formatEventTime } from "@/lib/format"
import { SectionRetry } from "./section-retry"

type Ticket = {
  id: string
  event_id: string
  events: { title: string; starts_at: string } | null
}

export function NextSteps({
  userId,
  bookings,
  tickets,
  failed,
}: {
  userId: string
  bookings: NextBooking[]
  tickets: Ticket[]
  failed: boolean
}) {
  const tasks = bookings.flatMap((booking) => {
    const action = bookingNextStep(booking, userId)
    return action
      ? [
          {
            id: booking.id,
            title: booking.items?.title ?? "Your loan",
            detail: `Return due ${formatEventDate(booking.end_date)}`,
            action,
            href: `/borrow/bookings/${booking.id}`,
          },
        ]
      : []
  })
  tasks.push(
    ...[...tickets]
      .sort((a, b) =>
        (a.events?.starts_at ?? "").localeCompare(b.events?.starts_at ?? "")
      )
      .flatMap((ticket) =>
        ticket.events
          ? [
              {
                id: ticket.id,
                title: ticket.events.title,
                detail: formatEventTime(ticket.events.starts_at),
                action: "Open ticket",
                href: `/events/${ticket.event_id}/ticket`,
              },
            ]
          : []
      )
  )
  return (
    <section aria-labelledby="next-step-heading">
      <h2 id="next-step-heading" className="text-h2">
        Your next step
      </h2>
      {failed ? <SectionRetry label="Your tasks" /> : null}
      {tasks.length ? (
        <ul className="mt-3 divide-y divide-hairline">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="font-bold break-words">{task.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{task.detail}</p>
              </div>
              <Link
                href={task.href}
                className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {task.action}
              </Link>
            </li>
          ))}
        </ul>
      ) : !failed ? (
        <p className="mt-3 text-sm text-ink-soft">
          You&apos;re all caught up. Browse items or join an event below.
        </p>
      ) : null}
    </section>
  )
}
