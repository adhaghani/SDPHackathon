"use client"

import { useActionState } from "react"

import { sendBookingMessage } from "@/actions/borrow"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function BookingChat({
  bookingId,
  messages,
  currentUserId,
}: {
  bookingId: string
  messages: Array<{ id: string; sender_id: string; body: string; created_at: string }>
  currentUserId: string
}) {
  const [state, action, pending] = useActionState(sendBookingMessage, idleState)

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="font-heading text-lg font-semibold">Booking chat</h2>
      <p className="mt-1 text-sm text-muted-foreground">Visible only to the borrower and lender.</p>
      <ul className="mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
        {messages.map((message) => (
          <li key={message.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.sender_id === currentUserId ? "self-end bg-line-borrow text-white" : "self-start bg-card"}`}>
            <p>{message.body}</p>
            <p className={`mt-1 text-xs ${message.sender_id === currentUserId ? "text-white/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleString("en-MY")}</p>
          </li>
        ))}
        {!messages.length ? <li className="text-sm text-muted-foreground">No messages yet.</li> : null}
      </ul>
      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="bookingId" value={bookingId} />
        <Field className="flex-1">
          <FieldLabel htmlFor="booking-message">Message</FieldLabel>
          <Textarea id="booking-message" name="body" rows={2} placeholder="Share a handover detail or ask a question" />
        </Field>
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Send
        </Button>
      </form>
      {state.message ? <p className="mt-2 text-sm text-muted-foreground">{state.message}</p> : null}
    </section>
  )
}
