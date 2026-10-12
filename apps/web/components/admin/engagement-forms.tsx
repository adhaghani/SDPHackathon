"use client"

import { useActionState } from "react"

import { approveHighlightAction, saveCarbonGoalAction } from "@/actions/admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function ApproveHighlightForm({
  monthStart,
  residentId,
  initialReason,
}: {
  monthStart: string
  residentId: string
  initialReason: string
}) {
  const [state, action, pending] = useActionState(approveHighlightAction, idleState)
  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="monthStart" value={monthStart} />
      <input type="hidden" name="residentId" value={residentId} />
      <Field>
        <FieldLabel htmlFor={`highlight-reason-${residentId}`}>Plain reason</FieldLabel>
        <Input id={`highlight-reason-${residentId}`} name="reason" defaultValue={initialReason} maxLength={160} required />
      </Field>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Approve highlight
      </Button>
    </form>
  )
}

export function CarbonGoalForm({ year, targetKg }: { year: number; targetKg?: number }) {
  const [state, action, pending] = useActionState(saveCarbonGoalAction, idleState)
  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="year" value={year} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="carbon-target">Target kg CO₂e</FieldLabel>
          <Input id="carbon-target" name="targetKg" type="number" min="1" step="0.001" defaultValue={targetKg ?? ""} required />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Save goal
          </Button>
        </div>
      </div>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
    </form>
  )
}
