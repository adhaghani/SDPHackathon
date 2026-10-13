"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { LogInIcon, LogOutIcon, RefreshCwIcon, ScanLineIcon, UserPlusIcon } from "lucide-react"

import {
  createWalkIn,
  getGuestPassCache,
  getGuardGuestLists,
  getGuardWalkIns,
  lookupWalkInHosts,
  markWalkInManual,
  recordGuardGuestScan,
  recordWalkInScan,
  resolveGuardGuest,
  syncQueuedGuestScan,
} from "@/actions/guest-guard"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  cacheGuestPasses,
  enqueueGuestScan,
  readGuestPassCache,
  readQueuedGuestScans,
  removeQueuedGuestScan,
  type CachedGuestPass,
} from "@/lib/offline-queue"
import { cn } from "@workspace/ui/lib/utils"

type Gate = { id: string; name: string }
type GuardResult = {
  valid: boolean
  reason?: string
  pass_id?: string
  visitor_name?: string
  vehicle_plate?: string | null
  valid_from?: string
  valid_until?: string
  status?: string
  is_inside?: boolean
  host_display_name?: string
  destination_unit?: string | null
}
type ListData = { inside?: Array<Record<string, unknown>>; logs?: Array<Record<string, unknown>> }
type WalkIn = {
  id: string
  status: string
  visitor_name: string
  requested_at: string
  timeout_minutes?: number
  gate_name?: string
  destination_unit?: string | null
}
type Host = { id: string; unit_label: string; display_name?: string | null }

function formatDate(value?: string): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(value))
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function GuardConsole({ gates, townshipId }: { gates: Gate[]; townshipId: string }) {
  const [gateId, setGateId] = useState("")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [manualPlate, setManualPlate] = useState("")
  const [idSighted, setIdSighted] = useState(false)
  const [result, setResult] = useState<GuardResult | null>(null)
  const [rawToken, setRawToken] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [lists, setLists] = useState<ListData>({})
  const [walkIns, setWalkIns] = useState<WalkIn[]>([])
  const [unitQuery, setUnitQuery] = useState("")
  const [hosts, setHosts] = useState<Host[]>([])
  const [hostMemberId, setHostMemberId] = useState("")
  const [walkName, setWalkName] = useState("")
  const [walkPlate, setWalkPlate] = useState("")
  const [walkPending, setWalkPending] = useState(false)
  const [walkMessage, setWalkMessage] = useState<string | null>(null)

  const activeGate = useMemo(() => gates.find((gate) => gate.id === gateId) ?? gates[0], [gates, gateId])

  const refreshLists = useCallback(async () => {
    const next = await getGuardGuestLists()
    if (next.status === "success") setLists((next.data ?? {}) as ListData)
    const walk = await getGuardWalkIns()
    if (walk.status === "success") setWalkIns((walk.data ?? []) as WalkIn[])
    setQueueCount((await readQueuedGuestScans()).length)
  }, [])

  const refreshCache = useCallback(async () => {
    if (!navigator.onLine) return
    const next = await getGuestPassCache()
    if (next.status === "success" && Array.isArray(next.data)) {
      await cacheGuestPasses((next.data as CachedGuestPass[]) ?? [])
    }
  }, [])

  const flushQueue = useCallback(async () => {
    try {
      const scans = await readQueuedGuestScans()
      for (const scan of scans) {
        const sync = await syncQueuedGuestScan({
          clientEventId: scan.client_event_id,
          direction: scan.direction,
          gateId: scan.gate_id,
          passId: scan.pass_id,
          token: scan.token,
          scannedAt: scan.scanned_at,
          idSighted: scan.id_sighted,
          note: scan.note,
          townshipId: scan.township_id,
        })
        if (sync.status === "success") await removeQueuedGuestScan(scan.client_event_id)
      }
      setQueueCount((await readQueuedGuestScans()).length)
      await refreshLists()
      if (scans.length) setMessage(`${scans.length} offline scan${scans.length === 1 ? "" : "s"} synchronized.`)
    } catch {
      setError("Offline scans will sync when the connection returns.")
    }
  }, [refreshLists])

  useEffect(() => {
    const remembered = localStorage.getItem("borrowlah-gate-id")
    setGateId(remembered && gates.some((gate) => gate.id === remembered) ? remembered : gates[0]?.id ?? "")
    setOnline(navigator.onLine)
    void refreshCache()
    void refreshLists()

    const onlineHandler = () => {
      setOnline(true)
      void refreshCache()
      void refreshLists()
      void flushQueue()
    }
    const offlineHandler = () => setOnline(false)
    const timer = window.setInterval(() => {
      void refreshCache()
      void refreshLists()
    }, 5 * 60 * 1000)
    const walkInTimer = window.setInterval(() => void refreshLists(), 10_000)

    window.addEventListener("online", onlineHandler)
    window.addEventListener("offline", offlineHandler)
    return () => {
      window.clearInterval(timer)
      window.clearInterval(walkInTimer)
      window.removeEventListener("online", onlineHandler)
      window.removeEventListener("offline", offlineHandler)
    }
  }, [flushQueue, gates, refreshCache, refreshLists])

  function chooseGate(value: string) {
    setGateId(value)
    localStorage.setItem("borrowlah-gate-id", value)
  }

  async function resolveInput(source: "token" | "short" | "plate", value: string) {
    const trimmed = value.trim()
    if (!trimmed || !activeGate) return
    setPending(true)
    setError(null)
    setMessage(null)
    setResult(null)
    setRawToken(source === "token" ? trimmed : "")

    if (!navigator.onLine && source === "token") {
      try {
        const hash = await sha256Hex(trimmed)
        const cached = (await readGuestPassCache()).find((pass) => pass.token_hash === hash)
        if (!cached) {
          setError("Invalid pass for this offline cache.")
          return
        }
        if (new Date(cached.valid_until) < new Date() || ["revoked", "expired"].includes(cached.effective_status ?? cached.status)) {
          setError("That pass is expired or revoked.")
          return
        }
        setResult({
          valid: true,
          pass_id: cached.pass_id,
          visitor_name: cached.visitor_name,
          vehicle_plate: cached.vehicle_plate,
          valid_from: cached.valid_from,
          valid_until: cached.valid_until,
          status: cached.effective_status ?? cached.status,
          is_inside: cached.is_inside,
          host_display_name: "Resident",
          destination_unit: cached.host_unit,
        })
        setMessage("Validated from the offline gate cache.")
      } catch {
        setError("Offline validation failed.")
      } finally {
        setPending(false)
      }
      return
    }

    try {
      const response = await resolveGuardGuest({
        townshipId,
        token: source === "token" ? trimmed : undefined,
        shortCode: source === "short" ? trimmed.toUpperCase() : undefined,
        plate: source === "plate" ? trimmed : undefined,
      })
      if (response.status !== "success" || !response.data) {
        setError(response.message ?? "The pass could not be validated.")
        return
      }
      setResult(response.data as GuardResult)
      setMessage("Pass validated.")
    } catch {
      setError("Validation is unavailable. Try again.")
    } finally {
      setPending(false)
    }
  }

  async function recordScan(direction: "in" | "out") {
    if (!result?.pass_id || !activeGate) return
    setPending(true)
    setError(null)
    setMessage(null)
    const clientEventId = crypto.randomUUID()
    const scannedAt = new Date().toISOString()

    if (!navigator.onLine && rawToken) {
      try {
        await enqueueGuestScan({
          client_event_id: clientEventId,
          pass_id: result.pass_id,
          direction,
          gate_id: activeGate.id,
          token: rawToken,
          scanned_at: scannedAt,
          id_sighted: idSighted,
          township_id: townshipId,
        })
        setQueueCount((await readQueuedGuestScans()).length)
        setMessage("Saved offline, will sync.")
        setResult(null)
        setIdSighted(false)
      } catch {
        setError("The scan could not be saved offline.")
      } finally {
        setPending(false)
      }
      return
    }

    try {
      const response = await recordGuardGuestScan({
        townshipId,
        direction,
        gateId: activeGate.id,
        scannedAt,
        clientEventId,
        idSighted: idSighted ? "true" : "false",
        token: rawToken || undefined,
        passId: result.pass_id,
        plate: !rawToken ? result.vehicle_plate ?? undefined : undefined,
      })
      if (response.status !== "success") {
        setError(response.message ?? "The scan could not be recorded.")
        return
      }
      setMessage(response.message ?? "Scan recorded.")
      setResult(null)
      setIdSighted(false)
      setRawToken("")
      await refreshLists()
    } catch {
      setError("The scan could not be recorded.")
    } finally {
      setPending(false)
    }
  }

  async function searchHosts() {
    setWalkPending(true)
    setWalkMessage(null)
    const response = await lookupWalkInHosts(unitQuery)
    if (response.status === "success") setHosts((response.data ?? []) as Host[])
    else setWalkMessage(response.message ?? null)
    setWalkPending(false)
  }

  async function submitWalkIn() {
    if (!activeGate || !hostMemberId) return
    setWalkPending(true)
    setWalkMessage(null)
    const response = await createWalkIn({
      townshipId,
      gateId: activeGate.id,
      hostMemberId,
      visitorName: walkName,
      vehiclePlate: walkPlate || undefined,
      clientRequestId: crypto.randomUUID(),
    })
    setWalkMessage(response.message ?? null)
    if (response.status === "success") {
      setWalkName("")
      setWalkPlate("")
      setHostMemberId("")
      setUnitQuery("")
      setHosts([])
      await refreshLists()
    }
    setWalkPending(false)
  }

  const insideRows = (lists.inside ?? []) as Array<Record<string, unknown>>
  const logRows = (lists.logs ?? []) as Array<Record<string, unknown>>

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-ink p-4 text-white">
        <div>
          <p className="text-tag text-on-dark-muted">Gate console</p>
          <p className="mt-1 text-[17px] leading-[21px] font-bold">{activeGate?.name ?? "No gates configured"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", online ? "bg-lime text-ink" : "bg-tomato text-ink")}>{online ? "Online" : "Offline"}</span>
          <Button type="button" variant="outline" size="sm" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => void flushQueue()} disabled={pending}>
            <RefreshCwIcon data-icon="inline-start" />{queueCount} queued
          </Button>
        </div>
      </div>

      <section className="rounded-[22px] bg-white p-5 text-ink" aria-labelledby="scan-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id="scan-heading" className="text-h2">Scan a guest pass</h1>
            <p className="mt-1 text-body text-ink-soft">Use the camera, short code or vehicle plate.</p>
          </div>
          <Button type="button" variant="cta" size="cta" onClick={() => setCameraOpen((value) => !value)}>
            <ScanLineIcon data-icon="inline-start" />{cameraOpen ? "Close camera" : "Open camera"}
          </Button>
        </div>

        <Field className="mt-4">
          <FieldLabel htmlFor="guard-gate">Gate</FieldLabel>
          <NativeSelect id="guard-gate" value={activeGate?.id ?? ""} onChange={(event) => chooseGate(event.target.value)} className="w-full">
            {gates.map((gate) => <NativeSelectOption key={gate.id} value={gate.id}>{gate.name}</NativeSelectOption>)}
          </NativeSelect>
        </Field>

        {cameraOpen ? (
          <div className="mt-4 overflow-hidden rounded-[20px] border-2 border-ink">
            <Scanner
              onScan={(codes) => {
                const token = codes[0]?.rawValue
                if (token) void resolveInput("token", token)
              }}
              onError={(scannerError) => setError(scannerError.message || "Camera unavailable. Use manual entry.")}
              formats={["qr_code"]}
              constraints={{ facingMode: "environment" }}
            />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="manual-code">Short code or QR token</FieldLabel>
            <Input id="manual-code" value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="ABCDEFGH" />
          </Field>
          <Field>
            <FieldLabel htmlFor="manual-plate">Vehicle plate</FieldLabel>
            <Input id="manual-plate" value={manualPlate} onChange={(event) => setManualPlate(event.target.value)} placeholder="ABC 1234" />
          </Field>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => void resolveInput(manualCode.trim().length > 8 ? "token" : "short", manualCode)} disabled={pending || !manualCode.trim()}>Validate</Button>
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => void resolveInput("plate", manualPlate)} disabled={pending || !manualPlate.trim()}>Plate</Button>
          </div>
        </div>

        {error ? <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {message ? <Alert className="mt-4"><AlertDescription>{message}</AlertDescription></Alert> : null}

        {result?.valid ? (
          <section className="mt-5 rounded-[22px] bg-paper p-5" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-tag text-ink-soft">{result.status}</p>
                <h2 className="mt-1 text-h2">{result.visitor_name}</h2>
                <p className="mt-1 text-body">{result.vehicle_plate || "No vehicle plate"} · {formatDate(result.valid_from)} – {formatDate(result.valid_until)}</p>
                <p className="mt-1 text-body"><strong>{result.host_display_name}</strong> · {result.destination_unit || "Unit unavailable"}</p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase", result.is_inside ? "bg-tomato text-ink" : "bg-lime text-ink")}>{result.is_inside ? "Inside now" : "Outside"}</span>
            </div>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[16px] border-2 border-ink bg-white px-4 text-sm font-bold">
              <Checkbox checked={idSighted} onCheckedChange={(value) => setIdSighted(value === true)} />
              ID sighted — no ID number is recorded
            </label>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="cta" size="cta" className="flex-1" onClick={() => void recordScan(result.is_inside ? "out" : "in")} disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : result.is_inside ? <LogOutIcon data-icon="inline-start" /> : <LogInIcon data-icon="inline-start" />}
                {result.is_inside ? "Check out" : "Check in"}
              </Button>
              <Button type="button" variant="outline" size="cta" onClick={() => { setResult(null); setRawToken(""); setMessage(null) }}>Clear</Button>
            </div>
          </section>
        ) : null}
      </section>

      <section className="rounded-[22px] bg-white p-5 text-ink" aria-labelledby="walkin-heading">
        <div className="flex items-center gap-2">
          <UserPlusIcon aria-hidden="true" className="size-5" />
          <h2 id="walkin-heading" className="text-h2">Walk-in visitor</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Field><FieldLabel htmlFor="walk-name">Visitor name</FieldLabel><Input id="walk-name" value={walkName} onChange={(event) => setWalkName(event.target.value)} /></Field>
          <Field><FieldLabel htmlFor="walk-plate">Plate (optional)</FieldLabel><Input id="walk-plate" value={walkPlate} onChange={(event) => setWalkPlate(event.target.value)} /></Field>
          <Field><FieldLabel htmlFor="walk-unit">Destination unit</FieldLabel><Input id="walk-unit" value={unitQuery} onChange={(event) => setUnitQuery(event.target.value)} /></Field>
          <div className="flex items-end"><Button type="button" variant="outline" className="h-11 w-full" onClick={() => void searchHosts()} disabled={walkPending || !unitQuery.trim()}>Find host</Button></div>
        </div>
        {hosts.length ? (
          <Field className="mt-3">
            <FieldLabel htmlFor="walk-host">Host</FieldLabel>
            <NativeSelect id="walk-host" value={hostMemberId} onChange={(event) => setHostMemberId(event.target.value)} className="w-full">
              <NativeSelectOption value="">Choose a host</NativeSelectOption>
              {hosts.map((host) => <NativeSelectOption key={host.id} value={host.id}>{host.display_name ?? "Resident"} · {host.unit_label}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
        ) : null}
        <Button type="button" variant="cta" className="mt-4 w-full sm:w-auto" onClick={() => void submitWalkIn()} disabled={walkPending || !walkName.trim() || !hostMemberId}>
          {walkPending ? <Spinner data-icon="inline-start" /> : null}Request approval
        </Button>
        {walkMessage ? <p className="mt-3 text-sm text-ink-soft">{walkMessage}</p> : null}

        {walkIns.length ? (
          <ScrollArea className="mt-4 max-h-72 rounded-[18px] bg-paper p-3" contentClassName="min-h-full">
            <ul className="flex flex-col gap-2">
              {walkIns.map((walkIn) => (
                <li key={walkIn.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-white p-3">
                  <div>
                    <p className="font-bold">{walkIn.visitor_name}</p>
                    <p className="text-sm text-ink-soft">{walkIn.gate_name} · {walkIn.destination_unit ?? "Unit"} · {walkIn.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {walkIn.status === "approved" ? (
                      <Button type="button" variant="cta" size="sm" onClick={() => void (async () => {
                        const response = await recordWalkInScan({ townshipId, gateId: activeGate?.id ?? "", walkInRequestId: walkIn.id, direction: "in" })
                        setWalkMessage(response.message ?? null)
                        await refreshLists()
                      })()}>Check in</Button>
                    ) : null}
                    {walkIn.status === "pending" && Date.now() - new Date(walkIn.requested_at).getTime() >= (walkIn.timeout_minutes ?? 5) * 60_000 ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void (async () => {
                        const response = await markWalkInManual(walkIn.id, "No host response within the configured timeout.")
                        setWalkMessage(response.message ?? null)
                        await refreshLists()
                      })()}>Record follow-up</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[22px] bg-white p-5 text-ink" aria-labelledby="inside-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="inside-heading" className="text-h2">Inside now</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => void refreshLists()}><RefreshCwIcon data-icon="inline-start" />Refresh</Button>
          </div>
          <ScrollArea className="mt-4 max-h-96" contentClassName="min-h-full">
            {insideRows.length ? (
              <ul className="flex flex-col gap-2">
                {insideRows.map((row, index) => {
                  const overstay = row.valid_until && new Date(String(row.valid_until)) < new Date()
                  return (
                    <li key={`${String(row.pass_id)}-${index}`} className={cn("rounded-[16px] p-3", overstay ? "bg-coral-tint text-ink" : "bg-paper text-ink")}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{String(row.visitor_name)}</p>
                        {overstay ? <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">Overstay</span> : null}
                      </div>
                      <p className="text-sm text-ink-soft">{String(row.gate_name)} · in {formatDate(String(row.scanned_at))} · {String(row.destination_unit ?? "Unit")}</p>
                    </li>
                  )
                })}
              </ul>
            ) : <p className="text-sm text-ink-soft">Nobody is inside.</p>}
          </ScrollArea>
        </section>

        <section className="rounded-[22px] bg-white p-5 text-ink" aria-labelledby="log-heading">
          <h2 id="log-heading" className="text-h2">Today&apos;s log</h2>
          <ScrollArea className="mt-4 max-h-96" contentClassName="min-h-full">
            {logRows.length ? (
              <ul className="flex flex-col gap-2">
                {logRows.map((row, index) => (
                  <li key={`${String(row.id)}-${index}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-paper p-3">
                    <div>
                      <p className="font-bold">{String(row.visitor_name ?? "Walk-in")}</p>
                      <p className="text-sm text-ink-soft">{String(row.gate_name)} · {String(row.direction).toUpperCase()}</p>
                    </div>
                    <span className="text-sm tabular-nums">{formatDate(String(row.scanned_at))}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-soft">No scans yet today.</p>}
          </ScrollArea>
        </section>
      </div>
    </div>
  )
}
