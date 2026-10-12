"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"

import { cancelRsvp, rsvpEvent } from "@/actions/events"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function EventRsvpActions({
  eventId,
  rsvpStatus,
  canVolunteer = true,
}: {
  eventId: string
  rsvpStatus: string | null
  canVolunteer?: boolean
}) {
  const router = useRouter()
  const [rsvpState, rsvpAction, rsvpPending] = useActionState(rsvpEvent, idleState)
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelRsvp, idleState)

  if (rsvpStatus === "going" || rsvpStatus === "checked_in") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-muted">
          {rsvpStatus === "checked_in" ? "Checked in" : "You are going"}
        </p>
        <form action={cancelAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <Button type="submit" variant="outline" className="h-11" disabled={cancelPending}>
            {cancelPending ? <Spinner data-icon="inline-start" /> : null}
            Cancel registration
          </Button>
        </form>
        {cancelState.message ? <p className="text-sm text-muted-foreground">{cancelState.message}</p> : null}
      </div>
    )
  }

  if (rsvpStatus === "waitlisted") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">You are on the waitlist</p>
        <form action={cancelAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <Button type="submit" variant="outline" className="h-11" disabled={cancelPending}>
            Leave waitlist
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={rsvpAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="eventId" value={eventId} />
        <Button type="submit" name="role" value="attendee" className="h-11 flex-1" disabled={rsvpPending}>
          {rsvpPending ? <Spinner data-icon="inline-start" /> : null}
          RSVP as attendee
        </Button>
        {canVolunteer ? (
          <>
            <Button type="submit" name="role" value="volunteer" variant="outline" className="h-11 flex-1" disabled={rsvpPending}>
              Volunteer
            </Button>
          </>
        ) : null}
      </form>
      {rsvpState.message ? <p className="text-sm text-muted-foreground">{rsvpState.message}</p> : null}
      {rsvpState.status === "success" && rsvpState.eventId ? (
        <button
          type="button"
          className="h-11 text-sm underline underline-offset-4"
          onClick={() => router.push(`/events/${rsvpState.eventId}/ticket`)}
        >
          Open ticket
        </button>
      ) : null}
    </div>
  )
}
