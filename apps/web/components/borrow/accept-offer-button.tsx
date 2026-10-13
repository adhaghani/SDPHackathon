"use client"

import { useActionState } from "react"

import { acceptItemOffer } from "@/actions/requests"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DateRangeField } from "@/components/forms/date-range-field"

const idleState = { status: "idle" } as const

export function AcceptOfferButton({ offerId }: { offerId: string }) {
  const [state, action, pending] = useActionState(acceptItemOffer, idleState)
  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="offerId" value={offerId} />
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[18rem] flex-1">
            <DateRangeField
              id={`accept-dates-${offerId}`}
              startName="startDate"
              endName="endDate"
              label="Available dates"
              required
            />
          </div>
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
