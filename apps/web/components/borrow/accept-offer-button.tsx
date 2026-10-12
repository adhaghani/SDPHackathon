"use client"

import { useActionState } from "react"

import { acceptItemOffer } from "@/actions/requests"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

const idleState = { status: "idle" } as const

export function AcceptOfferButton({ offerId }: { offerId: string }) {
  const [state, action, pending] = useActionState(acceptItemOffer, idleState)
  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="offerId" value={offerId} />
        <div className="flex flex-wrap items-end gap-2">
          <Field>
            <FieldLabel htmlFor={`accept-start-${offerId}`}>Start</FieldLabel>
            <Input id={`accept-start-${offerId}`} name="startDate" type="date" required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`accept-end-${offerId}`}>End</FieldLabel>
            <Input id={`accept-end-${offerId}`} name="endDate" type="date" required />
          </Field>
          <Button type="submit" variant="cta" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Accept offer
          </Button>
        </div>
      </form>
      {state.status === "error" && state.message ? (
        <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>
      ) : null}
    </div>
  )
}
