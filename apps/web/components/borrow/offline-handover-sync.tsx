"use client"

import { useState } from "react"

import { syncHandoverScan } from "@/actions/handover"
import { enqueueHandoverScan, getQueuedHandoverScans, removeQueuedHandoverScan } from "@/lib/offline-queue"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

export function OfflineHandoverSync() {
  const [token, setToken] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [queuedCount, setQueuedCount] = useState(0)

  async function refreshCount() {
    try {
      setQueuedCount((await getQueuedHandoverScans()).length)
    } catch {
      setQueuedCount(0)
    }
  }

  async function syncNow(value = token) {
    const trimmed = value.trim()
    if (!trimmed) return
    setPending(true)
    setError(null)
    try {
      const scan = {
        token: trimmed,
        bookingId: "offline-manual",
        deviceScannedAt: new Date().toISOString(),
        guideAcknowledged: true,
      }
      await enqueueHandoverScan(scan)
      await refreshCount()
      const result = await syncHandoverScan(trimmed, scan.deviceScannedAt, true)
      if (result.status === "success") {
        await removeQueuedHandoverScan(trimmed)
        setMessage("Handover synchronized.")
        setToken("")
        await refreshCount()
      } else {
        setMessage("Saved locally. It will sync when you reconnect.")
      }
    } catch {
      setMessage("Saved locally. It will sync when you reconnect.")
    } finally {
      setPending(false)
    }
  }

  async function flushQueue() {
    try {
      const scans = await getQueuedHandoverScans()
      for (const scan of scans) {
        const result = await syncHandoverScan(scan.token, scan.deviceScannedAt, scan.guideAcknowledged)
        if (result.status === "success") await removeQueuedHandoverScan(scan.token)
      }
      await refreshCount()
      setMessage(scans.length ? "Queued handovers synchronized." : "No queued handovers.")
    } catch {
      setError("The queue could not sync yet.")
    }
  }

  return (
    <section className="mt-6 rounded-lg bg-white/[0.08] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">Offline handover queue</p>
          <p className="text-sm text-ink-soft">{queuedCount} waiting to sync</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void flushQueue()}>
          Sync queue
        </Button>
      </div>
      <Textarea
        value={token}
        onChange={(event) => setToken(event.target.value)}
        rows={3}
        aria-label="Handover token"
        placeholder="Paste a handover token to save it offline"
        className="mt-3 border-white/20 bg-white/10 text-surface placeholder:text-white/50"
      />
      <Button type="button" variant="cta" size="sm" className="mt-3" disabled={pending || !token.trim()} onClick={() => void syncNow()}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save and sync when online
      </Button>
      {message ? <p className="mt-3 text-sm text-mint">{message}</p> : null}
      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
