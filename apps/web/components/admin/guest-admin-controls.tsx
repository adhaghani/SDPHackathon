"use client"

import { useActionState } from "react"

import { assignGuestGuard, saveGuestGate, saveGuestPassSettings } from "@/actions/guest-admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idle = { status: "idle" } as const

export type GuestSettings = {
  max_validity_days: number
  max_active_passes_per_resident: number
  max_days_ahead: number
  max_creates_per_resident_per_day: number
  retention_days: number
  overstay_grace_minutes: number
  walk_in_timeout_minutes: number
}

export type GateRow = { id: string; name: string }
export type MemberRow = { id: string; role: string; display_name: string }

export function GuestAdminControls({
  settings,
  gates,
  members,
}: {
  settings: GuestSettings
  gates: GateRow[]
  members: MemberRow[]
}) {
  const [gateState, gateAction, gatePending] = useActionState(saveGuestGate, idle)
  const [guardState, guardAction, guardPending] = useActionState(assignGuestGuard, idle)
  const [settingsState, settingsAction, settingsPending] = useActionState(saveGuestPassSettings, idle)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-[22px] bg-paper p-5" aria-labelledby="guest-settings-heading">
        <h2 id="guest-settings-heading" className="text-h2">Limits and retention</h2>
        <form action={settingsAction} className="mt-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field><FieldLabel htmlFor="max-validity">Max validity (days)</FieldLabel><Input id="max-validity" name="maxValidityDays" type="number" min={1} max={30} defaultValue={settings.max_validity_days} required /></Field>
            <Field><FieldLabel htmlFor="max-active">Active passes per resident</FieldLabel><Input id="max-active" name="maxActivePasses" type="number" min={1} max={100} defaultValue={settings.max_active_passes_per_resident} required /></Field>
            <Field><FieldLabel htmlFor="max-ahead">Start days ahead</FieldLabel><Input id="max-ahead" name="maxDaysAhead" type="number" min={1} max={90} defaultValue={settings.max_days_ahead} required /></Field>
            <Field><FieldLabel htmlFor="max-creates">Creates per day</FieldLabel><Input id="max-creates" name="maxCreates" type="number" min={1} max={100} defaultValue={settings.max_creates_per_resident_per_day} required /></Field>
            <Field><FieldLabel htmlFor="retention-days">Retention (days)</FieldLabel><Input id="retention-days" name="retentionDays" type="number" min={30} max={365} defaultValue={settings.retention_days} required /></Field>
            <Field><FieldLabel htmlFor="overstay-grace">Overstay grace (minutes)</FieldLabel><Input id="overstay-grace" name="overstayGrace" type="number" min={5} max={1440} defaultValue={settings.overstay_grace_minutes} required /></Field>
            <Field><FieldLabel htmlFor="walk-timeout">Walk-in timeout (minutes)</FieldLabel><Input id="walk-timeout" name="walkInTimeout" type="number" min={1} max={60} defaultValue={settings.walk_in_timeout_minutes} required /></Field>
          </FieldGroup>
          {settingsState.message ? <Alert className="mt-4" variant={settingsState.status === "error" ? "destructive" : "default"}><AlertDescription>{settingsState.message}</AlertDescription></Alert> : null}
          <Button type="submit" variant="cta" className="mt-4" disabled={settingsPending}>{settingsPending ? <Spinner data-icon="inline-start" /> : null}Save settings</Button>
        </form>
      </section>

      <section className="rounded-[22px] bg-paper p-5" aria-labelledby="gates-heading">
        <h2 id="gates-heading" className="text-h2">Gates</h2>
        <form action={gateAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="flex-1"><FieldLabel htmlFor="gate-name">New gate name</FieldLabel><Input id="gate-name" name="name" maxLength={80} placeholder="Back gate" required /></Field>
          <Button type="submit" variant="cta" disabled={gatePending}>{gatePending ? <Spinner data-icon="inline-start" /> : null}Add gate</Button>
        </form>
        {gateState.message ? <p className="mt-3 text-sm text-ink-soft">{gateState.message}</p> : null}
        <ul className="mt-4 flex flex-col gap-2">
          {gates.map((gate) => (
            <li key={gate.id} className="flex items-center justify-between gap-3 rounded-[16px] bg-white px-4 py-3">
              <span className="font-semibold">{gate.name}</span>
              <form action={gateAction}>
                <input type="hidden" name="gateId" value={gate.id} />
                <input type="hidden" name="name" value={gate.name} />
                <Button type="submit" variant="outline" size="sm">Keep active</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[22px] bg-paper p-5 xl:col-span-2" aria-labelledby="guards-heading">
        <h2 id="guards-heading" className="text-h2">Guard assignments</h2>
        <p className="mt-1 text-body text-ink-soft">Guards cannot self-register. Assignment is scoped to this township.</p>
        {guardState.message ? <p className="mt-3 text-sm text-ink-soft">{guardState.message}</p> : null}
        <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{member.display_name}</p>
                <p className="text-sm capitalize text-ink-soft">{member.role.replaceAll("_", " ")}</p>
              </div>
              <form action={guardAction}>
                <input type="hidden" name="memberId" value={member.id} />
                <input type="hidden" name="assign" value={member.role === "guard" ? "false" : "true"} />
                <Button type="submit" variant={member.role === "guard" ? "outline" : "cta"} size="sm" disabled={guardPending || member.role === "township_admin"}>
                  {guardPending ? <Spinner data-icon="inline-start" /> : member.role === "guard" ? "Remove guard" : "Make guard"}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
