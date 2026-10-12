"use client"

import { useCallback, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const period = process.env.NEXT_PUBLIC_ENABLE_ROTATING_QR === "true" ? 60 : 30

export function TicketClient({
  eventId,
  eventName,
  attendeeName,
  initialToken,
}: {
  eventId: string
  eventName: string
  attendeeName: string
  initialToken: string
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

  const circumference = 2 * Math.PI * 28
  const offset = circumference - (seconds / period) * circumference

  return (
    <div className="mx-auto w-full max-w-sm">
      <Link
        href={`/events/${eventId}`}
        className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md pr-2 text-sm font-bold text-ink hover:underline hover:underline-offset-4"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
        Event
      </Link>
      <div className="mt-2 overflow-hidden rounded-[20px] bg-surface shadow-raised">
        <div className="bb-band px-5 pt-5 pb-6">
          <p className="text-eyebrow text-band-eyebrow">Jom · Event pass</p>
          <h1 className="mt-1 font-display text-2xl leading-tight font-bold text-surface">{eventName}</h1>
          <p className="mt-2 text-sm text-band-eyebrow">{attendeeName}</p>
        </div>
        <div aria-hidden="true" className="relative h-0">
          <span className="absolute -top-3 -left-3 size-6 rounded-full bg-background" />
          <span className="absolute -top-3 -right-3 size-6 rounded-full bg-background" />
          <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-hairline" />
        </div>
        <div className="flex flex-col items-center px-5 pt-7 pb-6">
          <div className="relative rounded-xl border border-hairline bg-white p-4">
            {token ? (
              <QRCodeSVG value={token} size={220} level="M" includeMargin={false} />
            ) : (
              <div className="grid size-[220px] place-content-center text-ink-muted">
                <Spinner className="size-6" />
              </div>
            )}
            <svg aria-hidden="true" viewBox="0 0 64 64" className="pointer-events-none absolute -right-4 -bottom-4 size-14 rounded-full bg-surface">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E7E2F7" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#1B1340"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 32 32)"
              />
            </svg>
          </div>
          <p className="mt-5 text-center text-sm text-ink" aria-live="polite">
            Show this to the organiser at check-in.
            <span className="block text-ink-muted tabular-nums">New code in {seconds}s</span>
          </p>
          <Button type="button" variant="outline" className="mt-5 w-full" onClick={() => void refresh()} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Refresh code
          </Button>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-ink-muted">BetterPoints are added once the organiser scans you in.</p>
    </div>
  )
}
