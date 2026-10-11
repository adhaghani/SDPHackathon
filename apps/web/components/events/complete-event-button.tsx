"use client"

import { useActionState } from "react"

import { completeEvent } from "@/actions/events"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function CompleteEventButton({ eventId, disabled = false }: { eventId: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState(completeEvent, idleState)

  return (
    <div className="flex flex-col gap-3">
      <form action={action}>
        <input type="hidden" name="eventId" value={eventId} />
        <Button type="submit" variant="outline" className="h-11" disabled={disabled || pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Complete event
        </Button>
      </form>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
