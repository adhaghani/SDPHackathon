"use client"

import { useActionState, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Scanner } from "@yudiel/react-qr-scanner"

import { issueHandoverToken, syncHandoverScan } from "@/actions/handover"
import {
  enqueueHandoverScan,
  getQueuedHandoverScans,
  removeQueuedHandoverScan,
  type QueuedHandoverScan,
} from "@/lib/offline-queue"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function HandoverPanel({
  bookingId,
  status,
  actor,
  hasGuide,
}: {
  bookingId: string
  status: string
  actor: "borrower" | "lender"
  hasGuide: boolean
}) {
  const router = useRouter()
  const [issueState, issueAction, issuePending] = useActionState(issueHandoverToken, idleState)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [queuedCount, setQueuedCount] = useState(0)
  const [guideAcknowledged, setGuideAcknowledged] = useState(!hasGuide)

  const syncOne = useCallback(
    async (scan: QueuedHandoverScan) => {
      setSyncing(true)
      const result = await syncHandoverScan(
        scan.token,
        scan.deviceScannedAt,
        scan.guideAcknowledged
      )
      if (result.status === "success") {
        await removeQueuedHandoverScan(scan.token)
        setMessage(result.message ?? "Handover synchronized.")
        setError(null)
        router.refresh()
      } else if (typeof navigator !== "undefined" && !navigator.onLine) {
        setMessage("Handover recorded, will sync.")
        setError(null)
      } else {
        setError(result.message ?? "The queued handover scan could not be synchronized.")
      }
      setSyncing(false)
    },
    [router]
  )

  const refreshQueue = useCallback(async () => {
    try {
      const scans = await getQueuedHandoverScans()
      setQueuedCount(scans.length)
      if (scans.length && navigator.onLine) {
        for (const scan of scans) await syncOne(scan)
        setQueuedCount((await getQueuedHandoverScans()).length)
      }
    } catch {
      setQueuedCount(0)
    }
  }, [syncOne])

  useEffect(() => {
    void refreshQueue()
    const handleOnline = () => void refreshQueue()
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [refreshQueue])

  async function recordScan(rawToken: string) {
    const token = rawToken.trim()
    if (!token) return
    const scan: QueuedHandoverScan = {
      token,
      bookingId,
      deviceScannedAt: new Date().toISOString(),
      guideAcknowledged,
    }
    try {
      await enqueueHandoverScan(scan)
      setQueuedCount((await getQueuedHandoverScans()).length)
    } catch {
      setError("This browser cannot save offline scans. Stay online to complete handover.")
      return
    }
    await syncOne(scan)
  }

  if (status !== "approved") return null

  return (
    <section aria-labelledby="offline-handover-heading" className="mt-4 rounded-lg border border-hairline bg-ground p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="offline-handover-heading" className="font-bold text-ink">Offline-ready handover</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {actor === "lender"
              ? "Prepare a signed QR while online. The borrower can scan it and sync later."
              : "Scan the lender's QR. If you are offline, the scan waits safely on this device."}
          </p>
        </div>
        {queuedCount > 0 ? (
          <span className="rounded-full bg-coral-tint px-3 py-1 text-xs font-bold text-ink tabular-nums">
            {queuedCount} waiting to sync
          </span>
        ) : null}
      </div>

      {actor === "lender" ? (
        <form action={issueAction} className="mt-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <Button type="submit" variant="cta" disabled={issuePending}>
            {issuePending ? <Spinner data-icon="inline-start" /> : null}
            {issueState.status === "success" ? "Refresh handover code" : "Prepare handover QR"}
          </Button>
        </form>
      ) : null}

      {issueState.status === "success" && issueState.token ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-surface p-3">
          <QRCodeSVG value={issueState.token} size={160} level="M" aria-label="Booking handover QR" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Handover code ready</p>
            <p className="text-xs text-ink-muted">Expires {issueState.expiresAt}. Waiting for the borrower scan.</p>
          </div>
        </div>
      ) : null}
      {issueState.status === "error" && issueState.message ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{issueState.message}</AlertDescription>
        </Alert>
      ) : null}

      {actor === "borrower" ? (
        <div className="mt-4 flex flex-col gap-3">
          {hasGuide ? (
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-ink">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={guideAcknowledged}
                onChange={(event) => setGuideAcknowledged(event.target.checked)}
              />
              I&apos;ve read the how-to
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setCameraOpen((open) => !open)}>
              {cameraOpen ? "Close camera" : "Open QR scanner"}
            </Button>
          </div>
          {cameraOpen ? (
            <div className="overflow-hidden rounded-lg border border-hairline">
              <Scanner
                onScan={(codes) => {
                  const token = codes[0]?.rawValue
                  if (token) void recordScan(token)
                }}
                onError={(cameraError) =>
                  setError(cameraError.message || "Camera unavailable. Paste the code below.")
                }
                formats={["qr_code"]}
                constraints={{ facingMode: "environment" }}
              />
            </div>
          ) : null}
          <Textarea
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            rows={2}
            placeholder="Paste the handover token for an accessible fallback"
            aria-label="Handover token"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void recordScan(manualToken)}
            disabled={syncing || !manualToken.trim()}
          >
            {syncing ? <Spinner data-icon="inline-start" /> : null}
            Record handover
          </Button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-lg bg-mint-tint p-3 text-sm text-ink" aria-live="polite">
          {message}
        </p>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {syncing ? <p className="mt-2 text-xs text-ink-muted">Synchronizing…</p> : null}
    </section>
  )
}
