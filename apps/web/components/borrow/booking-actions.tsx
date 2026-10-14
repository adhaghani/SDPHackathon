"use client"

import { useActionState, useState } from "react"

import { transitionBooking } from "@/actions/borrow"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function BookingActions({
  bookingId,
  status,
  actor,
  borrowerWouldHaveBought,
  handoverConfirmed = false,
  hasGuide = false,
  canContest = false,
}: {
  bookingId: string
  status: string
  actor: "borrower" | "lender"
  borrowerWouldHaveBought: string | null
  handoverConfirmed?: boolean
  hasGuide?: boolean
  canContest?: boolean
}) {
  const [state, action, pending] = useActionState(transitionBooking, idleState)
  const [returnCondition, setReturnCondition] = useState("good")
  const actions: Array<{ action: string; label: string; variant?: "outline" | "ghost" }> = []
  const markReturned = status === "handed_over" && actor === "borrower" && !borrowerWouldHaveBought

  if (status === "requested" && actor === "lender") {
    actions.push({ action: "approve", label: "Approve request" }, { action: "decline", label: "Decline", variant: "ghost" })
  }
  if ((status === "requested" && actor === "borrower") || (status === "approved" && actor === "lender")) {
    actions.push({ action: "cancel", label: "Cancel", variant: "ghost" })
  }
  if (status === "approved" && !handoverConfirmed) {
    actions.push({ action: "confirm_handover", label: "Confirm handover" })
  }
  if (markReturned) {
    actions.push({ action: "mark_returned", label: "Mark returned" })
  }
  if (status === "handed_over" && actor === "lender" && borrowerWouldHaveBought) {
    actions.push({ action: "confirm_return", label: "Confirm return" })
  }
  if (status === "handed_over" || status === "completed") {
    actions.push({ action: "open_dispute", label: "Report an issue", variant: "ghost" })
  }
  if (canContest) actions.push({ action: "contest_condition", label: "Contest this rating", variant: "ghost" })

  if (!actions.length) return <p className="text-sm text-ink-muted">{status === "approved" && handoverConfirmed ? "Your handover is confirmed. Waiting for the other participant." : "No action is needed from you right now."}</p>

  return (
    <div className="flex flex-col gap-3">
      {status === "approved" && handoverConfirmed ? <p className="text-sm text-ink-muted">Your handover is confirmed. Waiting for the other participant.</p> : null}
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        {actions.map((item) =>
          item.action === "mark_returned" ? (
            <div key={item.action} className="flex flex-wrap gap-2">
              <Button
                type="submit"
                name="action"
                value={item.action}
                variant="cta"
                className="h-11"
                disabled={pending}
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {item.label}
              </Button>
              <select
                name="wouldHaveBought"
                defaultValue="no"
                aria-label="Without BorrowLah, would you have bought or rented this?"
                className="h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Not sure</option>
              </select>
              <input name="returnNote" placeholder="Optional return note" className="h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
          ) : item.action === "confirm_handover" ? (
            <div key={item.action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Button type="submit" variant="cta" name="action" value={item.action} className="h-11" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {item.label}
              </Button>
              <input name="handoverNote" placeholder="Optional handover note" className="h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
              {hasGuide && actor === "borrower" ? (
                <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium">
                  <input type="checkbox" name="guideAcknowledged" className="size-4 accent-ink" />
                  I&apos;ve read the how-to
                </label>
              ) : null}
            </div>
          ) : item.action === "confirm_return" ? (
            <div key={item.action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex flex-col gap-1 text-sm font-bold">
                Return condition
                <select
                  name="returnCondition"
                  value={returnCondition}
                  onChange={(event) => setReturnCondition(event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="like_new">Like new</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </label>
              {returnCondition === "damaged" ? (
                <input
                  name="returnConditionReason"
                  required
                  maxLength={600}
                  placeholder="Short reason required"
                  className="h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              ) : null}
              <Button type="submit" variant="cta" name="action" value={item.action} className="h-11" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {item.label}
              </Button>
            </div>
          ) : (
            <Button
              key={item.action}
              type="submit"
              name="action"
              value={item.action}
              variant={item.variant ?? "cta"}
              className="h-11"
              disabled={pending}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {item.label}
            </Button>
          )
        )}
      </form>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
