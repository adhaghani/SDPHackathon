"use client"

import { useActionState } from "react"

import { verifyVolunteerHours } from "@/actions/events"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function VolunteerHoursForm({ rsvpId, name }: { rsvpId: string; name: string }) {
  const [state, action, pending] = useActionState(verifyVolunteerHours, idleState)

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="rsvpId" value={rsvpId} />
      <div>
        <label htmlFor={`hours-${rsvpId}`} className="text-sm font-medium">{name} volunteer hours</label>
        <Input id={`hours-${rsvpId}`} name="hours" type="number" min="0.5" max="4" step="0.5" defaultValue="1" className="mt-2 h-11 w-full sm:w-28" />
      </div>
      <Button type="submit" variant="outline" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Verify hours
      </Button>
      {state.message ? <p className="text-sm text-muted-foreground sm:basis-full">{state.message}</p> : null}
    </form>
  )
}
