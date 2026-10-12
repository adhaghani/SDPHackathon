"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"

import { requestBooking } from "@/actions/borrow"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function BookingRequestForm({
  itemId,
  handoverOptions,
  maxLoanDays,
}: {
  itemId: string
  handoverOptions: string[]
  maxLoanDays: number
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(requestBooking, idleState)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="itemId" value={itemId} />
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(state.fieldErrors?.startDate)}>
            <FieldLabel htmlFor="start-date">Start date</FieldLabel>
            <Input id="start-date" name="startDate" type="date" required />
            <FieldError>{state.fieldErrors?.startDate?.[0]}</FieldError>
          </Field>
          <Field data-invalid={Boolean(state.fieldErrors?.endDate)}>
            <FieldLabel htmlFor="end-date">End date</FieldLabel>
            <Input id="end-date" name="endDate" type="date" required />
            <FieldError>{state.fieldErrors?.endDate?.[0]}</FieldError>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="handover-method">Handover option</FieldLabel>
          <select
            id="handover-method"
            name="handoverMethod"
            required
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {handoverOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Request to borrow
      </Button>
      <p className="text-xs text-muted-foreground">
        Maximum loan window: {maxLoanDays} days. Deposits, if any, are arranged offline.
      </p>
      {state.status === "success" && state.bookingId ? (
        <button type="button" className="h-11 text-sm underline underline-offset-4" onClick={() => router.push(`/borrow/bookings/${state.bookingId}`)}>
          Open booking
        </button>
      ) : null}
    </form>
  )
}
