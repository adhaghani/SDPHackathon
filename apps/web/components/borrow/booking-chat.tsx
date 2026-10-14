"use client"

import { useActionState } from "react"

import { sendBookingMessage } from "@/actions/borrow"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
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
    <section className="bb-card p-5">
      <h2 className="text-title text-ink">Booking chat</h2>
      <p className="mt-1 text-sm text-ink-muted">Visible to the borrower, lender and your township office for operational review.</p>
      <ScrollArea className="mt-4 max-h-72 rounded-lg bg-ground p-3" contentClassName="min-h-full">
      <ul className="flex flex-col gap-3">
        {messages.map((message) => (
          <li key={message.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.sender_id === currentUserId ? "self-end bg-lilac-tint text-ink" : "self-start border border-hairline bg-surface text-ink"}`}>
            <p>{message.body}</p>
            <p className={`mt-1 text-xs ${message.sender_id === currentUserId ? "text-ink-muted" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}</p>
          </li>
        ))}
        {!messages.length ? <li className="text-sm text-muted-foreground">No messages yet.</li> : null}
      </ul>
      </ScrollArea>
      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="bookingId" value={bookingId} />
        <Field className="flex-1">
          <FieldLabel htmlFor="booking-message">Message</FieldLabel>
          <Textarea id="booking-message" name="body" rows={2} placeholder="Share a handover detail or ask a question" />
        </Field>
        <Button type="submit" variant="cta" className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Send
        </Button>
      </form>
      {state.message ? <p className="mt-2 text-sm text-muted-foreground">{state.message}</p> : null}
    </section>
  )
}
