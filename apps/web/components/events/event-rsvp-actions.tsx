"use client"

import { useActionState } from "react"
import Link from "next/link"
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
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-5 font-bold text-inherit">
            {rsvpStatus === "checked_in" ? "Checked in" : "You're going"}
            {rsvpStatus === "going" ? <span className="sr-only">You are going</span> : null}
          </p>
          <form action={cancelAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <button type="submit" disabled={cancelPending} className="mt-0.5 text-xs text-current opacity-70 underline underline-offset-4">
              Cancel registration
            </button>
          </form>
          {cancelState.message ? <p className="mt-1 text-xs text-current opacity-70">{cancelState.message}</p> : null}
        </div>
        <Button render={<Link href={`/events/${eventId}/ticket`} />} variant="cta" size="cta">
          Open ticket
        </Button>
      </div>
    )
  }

  if (rsvpStatus === "waitlisted") {
    return (
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-5 font-bold text-inherit">You are on the waitlist</p>
          <form action={cancelAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <button type="submit" className="mt-0.5 text-xs text-current opacity-70 underline underline-offset-4">Leave waitlist</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={rsvpAction} className="flex items-center gap-3">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-5 font-bold text-inherit">Join this event</p>
          <p className="text-xs text-current opacity-70">Shared space · verified check-in</p>
        </div>
        {canVolunteer ? (
          <Button
            type="submit"
            name="role"
            value="volunteer"
            variant="outline"
            className="h-[52px] rounded-[20px] border-white/40 bg-transparent text-current hover:bg-white/10 max-sm:hidden"
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
          className="min-w-[112px]"
          disabled={rsvpPending}
        >
          {rsvpPending ? <Spinner data-icon="inline-start" /> : null}
          I&apos;m going
        </Button>
      </form>
      {rsvpState.message ? <p className="text-sm text-current opacity-70">{rsvpState.message}</p> : null}
      {rsvpState.status === "success" && rsvpState.eventId ? (
        <>
        <p className="text-sm font-semibold text-ink">You are going</p>
        <button type="button" className="h-11 text-sm underline underline-offset-4" onClick={() => router.push(`/events/${rsvpState.eventId}/ticket`)}>
          Open ticket
        </button>
        </>
      ) : null}
    </div>
  )
}
