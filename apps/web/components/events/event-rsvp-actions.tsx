"use client"

import { useActionState } from "react"
import Link from "next/link"

import { cancelRsvp, rsvpEvent } from "@/actions/events"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

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
  const [rsvpState, rsvpAction, rsvpPending] = useActionState(
    rsvpEvent,
    idleState
  )
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelRsvp,
    idleState
  )

  const status = rsvpStatus
  const cancellation = (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" className="justify-start px-0 text-current" />
        }
      >
        {status === "waitlisted" ? "Leave waitlist" : "Cancel registration"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="pr-8">
          <DialogTitle>
            {status === "waitlisted"
              ? "Leave the waitlist?"
              : "Cancel your registration?"}
          </DialogTitle>
          <DialogDescription>
            Your place will be released. You can register again if the event is
            still open.
          </DialogDescription>
        </DialogHeader>
        <form action={cancelAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <Button type="submit" variant="cta" disabled={cancelPending}>
            {cancelPending ? <Spinner /> : null}Confirm cancellation
          </Button>
          {cancelState.message ? (
            <p role="status" className="mt-3 text-sm">
              {cancelState.message}
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  )

  if (
    status === "going" ||
    status === "checked_in" ||
    status === "waitlisted"
  ) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-inherit">
            {status === "checked_in"
              ? "Checked in"
              : status === "waitlisted"
                ? "You are on the waitlist"
                : "You're going"}
          </p>
          {status === "going" ? (
            <span className="sr-only">You are going</span>
          ) : null}
          {status !== "checked_in" ? cancellation : null}
        </div>
        {status !== "waitlisted" ? (
          <Button
            render={<Link href={`/events/${eventId}/ticket`} />}
            variant="cta"
            size="cta"
          >
            Open ticket
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={rsvpAction} className="grid grid-cols-2 items-center gap-3">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="col-span-2 min-w-0">
          <p className="text-[15px] leading-5 font-bold text-inherit">
            Join this event
          </p>
          <p className="text-sm text-current opacity-70">
            Shared space · verified check-in
          </p>
        </div>
        {canVolunteer ? (
          <Button
            type="submit"
            name="role"
            value="volunteer"
            variant="outline"
            className="min-h-11 border-current bg-transparent text-current hover:bg-current/10"
            disabled={rsvpPending}
          >
            Volunteer
          </Button>
        ) : null}
        <Button
          type="submit"
          name="role"
          value="attendee"
          aria-label="Register to attend"
          variant="cta"
          size="cta"
          className={canVolunteer ? "min-w-0" : "col-span-2 min-w-0"}
          disabled={rsvpPending}
        >
          {rsvpPending ? <Spinner data-icon="inline-start" /> : null}
          I&apos;m going
        </Button>
      </form>
      {rsvpState.message ? (
        <p role="status" className="text-sm text-current opacity-70">
          {rsvpState.message}
        </p>
      ) : null}
    </div>
  )
}
