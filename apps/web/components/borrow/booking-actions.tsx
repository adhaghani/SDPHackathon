"use client"

import { useActionState } from "react"

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
}: {
  bookingId: string
  status: string
  actor: "borrower" | "lender"
  borrowerWouldHaveBought: string | null
}) {
  const [state, action, pending] = useActionState(transitionBooking, idleState)
  const actions: Array<{ action: string; label: string; variant?: "outline" | "ghost" }> = []
  const markReturned = status === "handed_over" && actor === "borrower" && !borrowerWouldHaveBought

  if (status === "requested" && actor === "lender") {
    actions.push({ action: "approve", label: "Approve request" }, { action: "decline", label: "Decline", variant: "ghost" })
  }
  if ((status === "requested" && actor === "borrower") || (status === "approved" && actor === "lender")) {
    actions.push({ action: "cancel", label: "Cancel", variant: "ghost" })
  }
  if (status === "approved") {
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

  if (!actions.length) return null

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        {actions.map((item) =>
          item.action === "mark_returned" ? (
            <div key={item.action} className="flex flex-wrap gap-2">
              <Button
                type="submit"
                name="action"
                value={item.action}
                className="h-11"
                disabled={pending}
              >
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {item.label}
              </Button>
              <select
                name="wouldHaveBought"
                defaultValue="no"
                aria-label="Without BorrowBetter, would you have bought or rented this?"
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
              <Button type="submit" name="action" value={item.action} className="h-11" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {item.label}
              </Button>
              <input name="handoverNote" placeholder="Optional handover note" className="h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
          ) : (
            <Button
              key={item.action}
              type="submit"
              name="action"
              value={item.action}
              variant={item.variant ?? "default"}
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
