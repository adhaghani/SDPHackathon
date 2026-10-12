"use client"

import { useCallback, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

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
  const [seconds, setSeconds] = useState(process.env.NEXT_PUBLIC_ENABLE_ROTATING_QR === "true" ? 60 : 30)
  const [pending, setPending] = useState(false)

  const refresh = useCallback(async () => {
    setPending(true)
    try {
      const response = await fetch(`/api/events/${eventId}/ticket`)
      if (!response.ok) throw new Error("Could not create a fresh ticket.")
      const payload = (await response.json()) as { token?: string }
      if (!payload.token) throw new Error("Ticket token missing.")
      setToken(payload.token)
      setSeconds(process.env.NEXT_PUBLIC_ENABLE_ROTATING_QR === "true" ? 60 : 30)
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
          return process.env.NEXT_PUBLIC_ENABLE_ROTATING_QR === "true" ? 60 : 30
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const circumference = 2 * Math.PI * 28
  const offset = circumference - (seconds / 30) * circumference

  return (
    <div className="mx-auto max-w-md bb-card p-5 text-center shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3 text-left">
        <div>
          <p className="text-sm text-muted-foreground">Event pass</p>
          <h1 className="font-display text-xl font-bold">{eventName}</h1>
        </div>
        <Badge variant="outline">Ready to scan</Badge>
      </div>
      <div className="mt-6 flex flex-col items-center">
        <div className="relative rounded-xl bg-white p-4">
          {token ? (
            <QRCodeSVG value={token} size={220} level="M" includeMargin={false} />
          ) : (
            <div className="grid size-[220px] place-content-center text-muted-foreground">
              <Spinner className="size-6" />
            </div>
          )}
          <svg
            aria-hidden="true"
            viewBox="0 0 64 64"
            className="pointer-events-none absolute -right-3 -bottom-3 size-16"
          >
            <circle cx="32" cy="32" r="28" fill="none" stroke="#E7E2F7" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#1B1340"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 32 32)"
            />
          </svg>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {attendeeName} · refreshes in {seconds}s
        </p>
      </div>
      <Button type="button" variant="outline" className="mt-6 h-11 w-full" onClick={() => void refresh()} disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Refresh ticket
      </Button>
    </div>
  )
}
