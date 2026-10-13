"use client"

import { useActionState } from "react"

import { verifyCalendarEventAction } from "@/actions/admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function CalendarVerificationActions({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  const [state, action, pending] = useActionState(verifyCalendarEventAction, idleState)
  return (
    <form action={action} className="mt-3 flex flex-wrap gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <Button type="submit" variant="cta" size="sm" disabled={pending || currentStatus === "verified"}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Verify date
      </Button>
      <Button type="submit" name="status" value="rejected" variant="ghost" size="sm" disabled={pending || currentStatus === "rejected"}>
        Reject date
      </Button>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"} className="w-full">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
