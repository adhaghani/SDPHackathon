"use client"

import { useState, useActionState } from "react"
import { RefreshCwIcon } from "lucide-react"

import { duplicateGuestPass, revokeGuestPass, setGuestPassCheckoutMute } from "@/actions/guest-pass"
import { SavedGuestPassShareButton } from "@/components/guests/guest-pass-sharing"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

type GuestLog = { direction?: string; scanned_at?: string } | null
export type GuestPassRow = {
  id: string
  visitor_name: string
  vehicle_plate?: string | null
  purpose?: string | null
  valid_from: string
  valid_until: string
  max_entries: number
  entries_used: number
  status: "active" | "revoked" | "expired" | "completed"
  mute_checkout_notifications: boolean
  is_inside: boolean
  entry_at?: string | null
  exit_at?: string | null
  latest_log: GuestLog
}

const idle = { status: "idle" } as const

const statusTone: Record<string, string> = {
  active: "bg-lime text-ink",
  revoked: "bg-tomato text-ink",
  expired: "bg-paper text-ink",
  completed: "bg-sky text-ink",
}

function formatTime(value?: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(value))
}

export function GuestPassList({ passes }: { passes: GuestPassRow[] }) {
  const [tab, setTab] = useState<"upcoming" | "inside" | "past">("upcoming")
  const [revokeState, revokeAction, revokePending] = useActionState(revokeGuestPass, idle)
  const [muteState, muteAction, mutePending] = useActionState(setGuestPassCheckoutMute, idle)
  const [duplicateState, duplicateAction, duplicatePending] = useActionState(duplicateGuestPass, idle)

  const filtered = passes.filter((pass) => {
    if (tab === "inside") return pass.is_inside
    if (tab === "past") return pass.status !== "active" || new Date(pass.valid_until) < new Date()
    return pass.status === "active" && new Date(pass.valid_until) >= new Date()
  })

  return (
    <section aria-labelledby="saved-passes-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 id="saved-passes-heading" className="text-h2">Your guest passes</h2>
          <p className="mt-1 text-body text-ink-soft">Revocation is immediate, even when the guard is offline.</p>
        </div>
        <div role="tablist" aria-label="Guest pass status" className="flex gap-1 rounded-full bg-ink p-1">
          {([
            ["upcoming", "Upcoming"],
            ["inside", "Inside now"],
            ["past", "Past"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn("min-h-10 rounded-full px-3 text-sm font-bold", tab === value ? "bg-lime text-ink" : "text-white")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {revokeState.message ? (
        <Alert className="mt-4" variant={revokeState.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{revokeState.message}</AlertDescription>
        </Alert>
      ) : null}
      {muteState.message ? <p className="mt-3 text-sm text-ink-soft">{muteState.message}</p> : null}
      {duplicateState.message ? <p className="mt-3 text-sm text-ink-soft">{duplicateState.message}</p> : null}

      {filtered.length ? (
        <ul className="mt-5 grid gap-4 lg:grid-cols-2">
          {filtered.map((pass) => (
            <li key={pass.id} className="rounded-[22px] bg-paper p-5 text-ink">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-tag text-ink-soft">{pass.purpose || "Guest visit"}</p>
                  <h3 className="mt-1 text-[17px] leading-[21px] font-bold">{pass.visitor_name}</h3>
                  {pass.vehicle_plate ? <p className="mt-1 text-meta text-ink-soft">Plate {pass.vehicle_plate}</p> : null}
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase", statusTone[pass.status])}>
                  {pass.is_inside ? "Inside" : pass.status}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-ink-soft">Valid</dt><dd className="font-semibold">{formatTime(pass.valid_from)} – {formatTime(pass.valid_until)}</dd></div>
                <div><dt className="text-ink-soft">Entries</dt><dd className="font-semibold tabular-nums">{pass.entries_used} / {pass.max_entries}</dd></div>
                <div><dt className="text-ink-soft">Entry / exit</dt><dd className="font-semibold">{formatTime(pass.entry_at)} / {formatTime(pass.exit_at)}</dd></div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                {pass.status === "active" && new Date(pass.valid_until) > new Date() && pass.entries_used < pass.max_entries ? (
                  <SavedGuestPassShareButton passId={pass.id} />
                ) : null}
                <form action={muteAction}>
                  <input type="hidden" name="passId" value={pass.id} />
                  <input type="hidden" name="mute" value={pass.mute_checkout_notifications ? "false" : "true"} />
                  <Button type="submit" variant="outline" size="sm" disabled={mutePending}>
                    {mutePending ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
                    {pass.mute_checkout_notifications ? "Muted" : "Mute checkout alerts"}
                  </Button>
                </form>
                <form action={duplicateAction}>
                  <input type="hidden" name="passId" value={pass.id} />
                  <Button type="submit" variant="outline" size="sm" disabled={duplicatePending}>
                    {duplicatePending ? <Spinner data-icon="inline-start" /> : null}
                    Duplicate
                  </Button>
                </form>
                {pass.status === "active" ? (
                  <form action={revokeAction}>
                    <input type="hidden" name="passId" value={pass.id} />
                    <Button type="submit" variant="destructive" size="sm" disabled={revokePending}>
                      {revokePending ? <Spinner data-icon="inline-start" /> : null}
                      Revoke
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-5 rounded-[22px] bg-paper">
          <EmptyHeader>
            <EmptyTitle>{tab === "upcoming" ? "No upcoming passes" : tab === "inside" ? "Nobody is inside" : "No past passes"}</EmptyTitle>
            <EmptyDescription>{tab === "upcoming" ? "Create a pass before your visitor arrives." : "Guest activity will appear here."}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
}
