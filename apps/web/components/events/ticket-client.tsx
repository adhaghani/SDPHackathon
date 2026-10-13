"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { CalendarDaysIcon, ChevronLeftIcon, CheckIcon, MapPinIcon, RefreshCwIcon, UsersRoundIcon } from "lucide-react"

import { Spinner } from "@workspace/ui/components/spinner"

const period = process.env.NEXT_PUBLIC_ENABLE_ROTATING_QR === "true" ? 60 : 30

export function TicketClient({
  eventId,
  eventName,
  attendeeName,
  initialToken,
  dateLabel,
  timeLabel,
  pointsLabel,
  location,
  attendeeCount,
  volunteerSlots,
  volunteerPoints,
  startsAt,
  endsAt,
}: {
  eventId: string
  eventName: string
  attendeeName: string
  initialToken: string
  dateLabel: string
  timeLabel: string
  pointsLabel: string
  location: string
  attendeeCount: number
  volunteerSlots: number
  volunteerPoints: number
  startsAt: string
  endsAt: string
}) {
  const [token, setToken] = useState<string | null>(initialToken)
  const [seconds, setSeconds] = useState(period)
  const [pending, setPending] = useState(false)

  const refresh = useCallback(async () => {
    setPending(true)
    try {
      const response = await fetch(`/api/events/${eventId}/ticket`)
      if (!response.ok) throw new Error("Could not create a fresh ticket.")
      const payload = (await response.json()) as { token?: string }
      if (!payload.token) throw new Error("Ticket token missing.")
      setToken(payload.token)
      setSeconds(period)
    } finally {
      setPending(false)
    }
  }, [eventId])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          void refresh()
          return period
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const calendarFile = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${eventName}`,
    `DTSTART:${startsAt.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTEND:${endsAt.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\\n")
  const calendarHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarFile)}`

  return (
    <div className="on-dark mx-auto w-full max-w-[560px] text-white">
      <header className="flex items-center justify-between gap-3">
        <Link
          href={`/events/${eventId}`}
          aria-label="Back"
          className="grid size-11 place-items-center rounded-full bg-ink-raised text-white transition-colors hover:bg-white/15"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-[22px]" strokeWidth={2.25} />
        </Link>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-lime px-3 text-[13px] font-bold text-ink">
          <CheckIcon aria-hidden="true" className="size-4" strokeWidth={3} />
          You&apos;re going
        </span>
      </header>

      <article aria-label="Your ticket" className="mt-5 overflow-hidden rounded-[28px] bg-tomato text-ink">
        <div className="flex flex-col gap-2.5 px-[22px] pt-6 pb-5">
          <span className="text-xs font-bold tracking-[0.1em]">JOM · EVENT PASS</span>
          <h1 className="text-ticket text-balance">{eventName}</h1>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs font-semibold">Date</div>
              <div className="mt-0.5 text-base font-bold">{dateLabel}</div>
            </div>
            <div>
              <div className="text-xs font-semibold">Time</div>
              <div className="mt-0.5 text-base font-bold">{timeLabel}</div>
            </div>
            <div>
              <div className="text-xs font-semibold">Earn</div>
              <div className="mt-0.5 text-base font-bold">{pointsLabel}</div>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="relative h-6">
          <span className="absolute top-0 -left-3 size-6 rounded-full bg-ink" />
          <span className="absolute top-0 -right-3 size-6 rounded-full bg-ink" />
          <span className="absolute inset-x-5 top-[11px] border-t-2 border-dashed border-ink" />
        </div>

        <div className="flex items-center gap-[18px] bg-lime px-[22px] py-5">
          <div className="relative size-32 shrink-0 rounded-[12px] bg-white p-2">
            {token ? (
              <QRCodeSVG value={token} size={112} level="M" title="Event check-in QR code" includeMargin={false} bgColor="#ffffff" fgColor="#111111" />
            ) : (
              <div className="grid size-full place-items-center">
                <Spinner className="size-6 text-ink" />
              </div>
            )}
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={pending}
              aria-label="Refresh QR code"
              className="absolute -right-2 -bottom-2 grid size-8 place-items-center rounded-full border-2 border-ink bg-white text-ink"
            >
              <RefreshCwIcon aria-hidden="true" className={pending ? "size-4 animate-spin" : "size-4"} />
            </button>
          </div>
          <div className="min-w-0">
            <h2 className="text-[20px] leading-[22px] font-extrabold">Show this at the gate</h2>
            <p className="mt-1.5 text-sm leading-[19px]">
              {attendeeName}, points land the moment you&apos;re scanned in.
            </p>
            <p className="mt-1 text-xs tabular-nums">New code in {seconds}s</p>
          </div>
        </div>
      </article>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 items-center gap-2.5 rounded-[18px] bg-ink-raised px-4 text-[15px] font-semibold text-white"
        >
          <MapPinIcon aria-hidden="true" className="size-5" />
          Directions
        </a>
        <a
          href={calendarHref}
          download={`${eventName.replaceAll(" ", "-").toLowerCase()}.ics`}
          className="flex min-h-14 items-center gap-2.5 rounded-[18px] bg-ink-raised px-4 text-[15px] font-semibold text-white"
        >
          <CalendarDaysIcon aria-hidden="true" className="size-5" />
          Add to calendar
        </a>
      </div>

      <section className="mt-5 flex flex-col gap-1.5 rounded-[20px] border-2 border-ink-raised px-[18px] py-4">
        <span className="text-[15px] font-bold text-white">{location}</span>
        <span className="flex items-center gap-1.5 text-sm text-on-dark-muted">
          <UsersRoundIcon aria-hidden="true" className="size-4" />
          {attendeeCount} neighbours going · {attendeeName} is on the list.
        </span>
        <span className="text-sm text-on-dark-muted">Bring gloves if you have them.</span>
      </section>

      {volunteerSlots > 0 ? (
        <Link
          href={`/events/${eventId}`}
          className="mt-5 flex items-center justify-between gap-3 rounded-[20px] bg-mustard px-[18px] py-4 text-ink"
        >
          <span>
            <span className="block text-base font-bold">Want to volunteer instead?</span>
            <span className="mt-0.5 block text-sm">{volunteerSlots} spots left · +{volunteerPoints} BP per verified hour</span>
          </span>
          <span aria-hidden="true" className="text-2xl">›</span>
        </Link>
      ) : null}

    </div>
  )
}
