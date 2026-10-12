import Link from "next/link"
import { notFound } from "next/navigation"

import { BookingActions } from "@/components/borrow/booking-actions"
import { BookingChat } from "@/components/borrow/booking-chat"
import { BlockUserButton } from "@/components/reports/block-user-button"
import { PageBand } from "@/components/shared/page-band"
import { RealtimeRefresh } from "@/components/shared/realtime-refresh"
import { requireActiveMember } from "@/lib/data"
import { formatEventDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

const timeline = [
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "handed_over", label: "Handed over" },
  { key: "returned", label: "Returned" },
  { key: "completed", label: "Completed" },
]

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [bookingResult, messagesResult] = await Promise.all([
    supabase
      .from("bookings")
    .select("id,status,start_date,end_date,handover_method,handover_note,return_note,borrower_id,lender_id,borrower_would_have_bought,borrower_handover_confirmed_at,lender_handover_confirmed_at,borrower_return_marked_at,lender_return_confirmed_at,items(title,photo_paths,item_categories(name))")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("booking_messages")
      .select("id,sender_id,body,created_at")
      .eq("booking_id", id)
      .order("created_at"),
  ])
  if (!bookingResult.data) notFound()
  const booking = bookingResult.data
  const actor = booking.borrower_id === active.user.id ? "borrower" : "lender"
  const otherUserId = booking.borrower_id === active.user.id ? booking.lender_id : booking.borrower_id
  const currentIndex = timeline.findIndex((step) => step.key === booking.status)
  const returned = Boolean(booking.borrower_return_marked_at)

  return (
    <div className="mx-auto max-w-3xl">
      <RealtimeRefresh table="booking_messages" filter={`booking_id=eq.${id}`} />
      <PageBand
        eyebrow="Booking"
        title={booking.items?.title ?? "Borrowing request"}
        description={`${formatEventDate(booking.start_date)} – ${formatEventDate(booking.end_date)} · ${booking.handover_method}`}
        actions={<Button render={<Link href="/borrow/mine" />} variant="outline">Back to my borrowing</Button>}
      >
        <Badge variant="secondary" className="w-fit bg-sun text-ink">{booking.status.replace("_", " ")}</Badge>
      </PageBand>
      {booking.handover_note ? <p className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-sm"><strong>Handover note:</strong> {booking.handover_note}</p> : null}
      {booking.return_note ? <p className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-sm"><strong>Return note:</strong> {booking.return_note}</p> : null}

      <section className="mt-8 border-y border-border py-6">
        <h2 className="font-display text-lg">Timeline</h2>
        <ol className="mt-5 border-l-4 border-lilac pl-5">
          {timeline.map((step, index) => {
            const complete = booking.status === "completed" || index <= currentIndex || (step.key === "returned" && returned)
            return (
              <li key={step.key} className="relative py-3">
                <span aria-hidden="true" className={`absolute -left-[27px] top-6 size-3 rounded-full border-4 border-card ${complete ? "bg-line-borrow" : "bg-border"}`} />
                <div className="flex items-center justify-between gap-3">
                  <p className={complete ? "font-medium" : "text-muted-foreground"}>{step.label}</p>
                  {complete ? <span className="text-xs font-bold text-ink">Done</span> : <span className="text-xs text-muted-foreground">Next</span>}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-7">
        <h2 className="font-display text-lg">Actions</h2>
        <div className="mt-4">
          <BookingActions bookingId={booking.id} status={booking.status} actor={actor} borrowerWouldHaveBought={booking.borrower_would_have_bought} />
        </div>
        {returned ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Without BorrowBetter, would you have bought or rented this? <strong>{booking.borrower_would_have_bought}</strong>
          </p>
        ) : null}
      </section>

      <BookingChat bookingId={booking.id} messages={messagesResult.data ?? []} currentUserId={active.user.id} />
      <div className="mt-5"><BlockUserButton blockedId={otherUserId} name="other participant" /></div>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="font-display text-lg">Safety</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Meet in shared spaces. Never share bank or ID details. Report an issue from the booking if something feels wrong.
        </p>
      </section>
    </div>
  )
}
