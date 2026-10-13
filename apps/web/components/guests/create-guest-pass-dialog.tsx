"use client"

import { useEffect, useMemo, useRef, useState, useActionState } from "react"
import { CalendarIcon, CheckIcon, CopyIcon, DownloadIcon, Share2Icon } from "lucide-react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"

import { createGuestPass } from "@/actions/guest-pass"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date)
}

export function CreateGuestPassDialog() {
  const [state, action, pending] = useActionState(createGuestPass, idleState)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>(() => new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("18:00")
  const [dateError, setDateError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const shareUrl = useMemo(() => {
    if (!state.token || typeof window === "undefined") return ""
    return `${window.location.origin}/pass/${state.token}`
  }, [state.token])

  useEffect(() => {
    if (state.status === "success" && state.token) {
      setOpen(true)
      setCopied(false)
    }
  }, [state.status, state.token])

  function combineDateAndTime() {
    if (!date) return { from: "", until: "" }
    const from = new Date(`${toIsoDate(date)}T${startTime || "09:00"}`)
    const until = new Date(`${toIsoDate(date)}T${endTime || "18:00"}`)
    return { from: from.toISOString(), until: until.toISOString() }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    const { from, until } = combineDateAndTime()
    if (!from || !until || new Date(until) <= new Date(from)) {
      event.preventDefault()
      setDateError("Choose an end time after the start time.")
      return
    }
    setDateError(null)
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current?.querySelector("canvas")
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "borrowlah-guest-pass.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const dates = combineDateAndTime()

  return (
    <>
      <Dialog>
        <DialogTrigger render={<Button type="button" variant="cta" size="cta" className="w-full sm:w-auto" />}>
          New guest pass
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create a guest pass</DialogTitle>
            <DialogDescription>Share a private QR with one visitor. Their unit and host details stay hidden.</DialogDescription>
          </DialogHeader>

          <form action={action} onSubmit={submit} className="mt-2 flex flex-col gap-4">
            <input type="hidden" name="validFrom" value={dates.from} />
            <input type="hidden" name="validUntil" value={dates.until} />

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="guest-name">Visitor name</FieldLabel>
                <Input id="guest-name" name="visitorName" required maxLength={100} placeholder="Aina Rahman" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={Boolean(dateError)}>
                  <FieldLabel htmlFor="guest-date">Visit date</FieldLabel>
                  <Popover>
                    <PopoverTrigger render={<Button id="guest-date" type="button" variant="outline" className="w-full justify-start gap-2 text-left font-normal"><CalendarIcon data-icon="inline-start" />{formatShortDate(date)}</Button>} />
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(value) => value && setDate(value)} />
                    </PopoverContent>
                  </Popover>
                  <FieldError>{dateError}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="guest-start-time">From</FieldLabel>
                  <Input id="guest-start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="guest-end-time">Until</FieldLabel>
                  <Input id="guest-end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="guest-phone">Phone (optional)</FieldLabel>
                  <Input id="guest-phone" name="visitorPhone" type="tel" maxLength={40} placeholder="+60 12 345 6789" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="guest-plate">Vehicle plate (optional)</FieldLabel>
                  <Input id="guest-plate" name="vehiclePlate" maxLength={24} placeholder="ABC 1234" />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="guest-purpose">Purpose (optional)</FieldLabel>
                <Input id="guest-purpose" name="purpose" maxLength={80} placeholder="Family visit" />
                <FieldDescription>Do not enter IC or passport numbers. The guard only ticks “ID sighted”.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="guest-entries">Maximum entries</FieldLabel>
                <Input id="guest-entries" name="maxEntries" type="number" min={1} max={100} defaultValue={1} required />
              </Field>
            </FieldGroup>

            {state.message ? (
              <Alert variant={state.status === "error" ? "destructive" : "default"}>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" variant="cta" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Create pass
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guest pass ready</DialogTitle>
            <DialogDescription>Share this once. Revoking it takes effect immediately at the gate.</DialogDescription>
          </DialogHeader>

          {state.token && state.shortCode ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-[22px] bg-white p-4 ring-2 ring-ink">
                <QRCodeSVG value={shareUrl} size={220} level="M" title="Guest access QR code" bgColor="#ffffff" fgColor="#111111" />
              </div>
              <div ref={canvasRef} className="hidden" aria-hidden="true">
                {shareUrl ? <QRCodeCanvas value={shareUrl} size={512} level="M" includeMargin /> : null}
              </div>
              <div className="rounded-full bg-ink px-4 py-2 font-mono text-lg font-bold tracking-[0.3em] text-white">{state.shortCode}</div>
              <p className="break-all text-center text-xs text-ink-soft">{shareUrl}</p>
            </div>
          ) : null}

          <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button type="button" variant="outline" onClick={() => void copyLink()}>
              {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Guest pass for BorrowLah: ${shareUrl}`)}`, "_blank", "noopener,noreferrer")}
            >
              <Share2Icon data-icon="inline-start" />
              WhatsApp
            </Button>
            <Button type="button" variant="cta" onClick={downloadPng}>
              <DownloadIcon data-icon="inline-start" />
              Download PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
