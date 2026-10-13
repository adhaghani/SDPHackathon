"use client"

import { useActionState } from "react"

import { bookBundle } from "@/actions/bundles"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { DateRangeField } from "@/components/forms/date-range-field"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function BundleBookingForm({ bundleId, handoverOptions }: { bundleId: string; handoverOptions: string[] }) {
  const [state, action, pending] = useActionState(bookBundle, idleState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="bundleId" value={bundleId} />
      <DateRangeField
        id={`bundle-dates-${bundleId}`}
        startName="startDate"
        endName="endDate"
        label="Borrowing dates"
        required
      />
      <Field>
        <FieldLabel htmlFor={`bundle-handover-${bundleId}`}>Handover</FieldLabel>
        <select
          id={`bundle-handover-${bundleId}`}
          name="handoverMethod"
          required
          className="h-11 w-full rounded-lg border border-ink-muted bg-surface px-3 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {handoverOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </Field>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Request the whole bundle
      </Button>
      <p className="text-xs text-ink-muted">All items must be available together. The request succeeds or fails as one group.</p>
    </form>
  )
}
