"use client"

import { useActionState } from "react"

import { resolveDisputeAction, reversePointsAction, saveProgrammeCost } from "@/actions/admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function ProgrammeCostForm({ month }: { month: string }) {
  const [state, action, pending] = useActionState(saveProgrammeCost, idleState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="programme-month">Month</FieldLabel>
        <Input id="programme-month" name="month" type="date" defaultValue={month} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="programme-label">Label</FieldLabel>
        <Input id="programme-label" name="label" placeholder="Volunteer refreshments" required />
      </Field>
      <Field>
        <FieldLabel htmlFor="programme-amount">Amount (RM)</FieldLabel>
        <Input id="programme-amount" name="amountRm" type="number" min="0" step="0.01" required />
      </Field>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save programme cost
      </Button>
    </form>
  )
}

export function ReversePointsForm({ ledgerId }: { ledgerId: string }) {
  const [state, action, pending] = useActionState(reversePointsAction, idleState)

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="ledgerId" value={ledgerId} />
      <Field className="flex-1">
        <FieldLabel htmlFor={`reverse-reason-${ledgerId}`}>Reason</FieldLabel>
        <Input id={`reverse-reason-${ledgerId}`} name="reason" placeholder="Duplicate award" required />
      </Field>
      <Button type="submit" variant="destructive" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Reverse
      </Button>
      {state.message ? <p className="text-sm text-muted-foreground sm:basis-full">{state.message}</p> : null}
    </form>
  )
}

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [state, action, pending] = useActionState(resolveDisputeAction, idleState)

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="disputeId" value={disputeId} />
      <Field className="flex-1">
        <FieldLabel htmlFor={`dispute-note-${disputeId}`}>Resolution note</FieldLabel>
        <Input id={`dispute-note-${disputeId}`} name="note" placeholder="Reviewed with both parties" />
      </Field>
      <Button type="submit" name="resolution" value="completed" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Complete
      </Button>
      <Button type="submit" name="resolution" value="closed" variant="ghost" className="h-11" disabled={pending}>
        Close
      </Button>
      {state.message ? <p className="text-sm text-muted-foreground sm:basis-full">{state.message}</p> : null}
    </form>
  )
}
