"use client"

import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

export function QrCheckIn({ eventId }: { eventId: string }) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)

  async function submitToken(token: string) {
    if (!token.trim()) return
    setPending(true)
    setError(false)
    setMessage(null)
    try {
      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(true)
        setMessage(
          payload.error === "invalid_or_expired_ticket"
            ? "That ticket is invalid or expired. Ask for a fresh code."
            : "The ticket could not be checked in."
        )
        return
      }
      const name = payload.data?.display_name ?? "Neighbour"
      const points = payload.data?.points?.delta
      setMessage(
        payload.data?.status === "already_checked_in"
          ? `${name} is already checked in.`
          : `${name} checked in${points ? ` · +${points} BP` : ""}.`
      )
    } catch {
      setError(true)
      setMessage("The check-in service is unavailable. Use manual search below.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="bb-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-title text-ink">QR check-in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan a fresh event pass, or paste the token for an accessible fallback.
          </p>
        </div>
        <Button type="button" variant="cta" className="h-11" onClick={() => setCameraOpen((value) => !value)}>
          {cameraOpen ? "Close camera" : "Open camera scanner"}
        </Button>
      </div>
      {cameraOpen ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <Scanner
            onScan={(codes) => {
              const token = codes[0]?.rawValue
              if (token) void submitToken(token)
            }}
            onError={(scannerError) => {
              setError(true)
              setMessage(scannerError.message || "Camera unavailable. Use manual token entry.")
            }}
            formats={["qr_code"]}
            constraints={{ facingMode: "environment" }}
          />
        </div>
      ) : null}
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field className="flex-1">
          <FieldLabel htmlFor="qr-token">Ticket token</FieldLabel>
          <Textarea id="qr-token" value={manualToken} onChange={(event) => setManualToken(event.target.value)} rows={2} placeholder="Paste the QR token" />
        </Field>
        <Button type="button" variant="outline" className="h-11" onClick={() => void submitToken(manualToken)} disabled={pending}>
          Check token
        </Button>
      </form>
      {message ? (
        <Alert variant={error ? "destructive" : "default"} className="mt-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
