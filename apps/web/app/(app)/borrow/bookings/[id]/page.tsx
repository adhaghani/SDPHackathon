import { notFound } from "next/navigation"

import { BookingActions } from "@/components/borrow/booking-actions"
import { BookingChat } from "@/components/borrow/booking-chat"
import { BlockUserButton } from "@/components/reports/block-user-button"
import { PageBand } from "@/components/shared/page-band"
import { RealtimeRefresh } from "@/components/shared/realtime-refresh"
import { requireActiveMember } from "@/lib/data"
import { formatEventDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { StatusPill } from "@/components/shared/status-pill"
import { cn } from "@workspace/ui/lib/utils"

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

  const range = `${formatEventDate(booking.start_date).replace(/ \d{4}$/, "")} – ${formatEventDate(booking.end_date).replace(/ \d{4}$/, "")}`

  return (
    <div className="w-full">
      <RealtimeRefresh table="booking_messages" filter={`booking_id=eq.${id}`} />
      <PageBand
        back={{ href: "/borrow/mine", label: "Borrowing and lending" }}
        eyebrow={`Pinjam · ${actor === "borrower" ? "You're borrowing" : "You're lending"}`}
        title={booking.items?.title ?? "Borrowing request"}
        description={`${range} · ${booking.handover_method}`}
        actions={<StatusPill status={booking.status} className="px-3 py-1 text-sm" />}
      />

      <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="progress-heading" className="bb-card p-5">
            <h2 id="progress-heading" className="text-title text-ink">Progress</h2>
            <ol className="mt-4 flex flex-col">
              {timeline.map((step, index) => {
                const complete = booking.status === "completed" || index <= currentIndex || (step.key === "returned" && returned)
                const current = !complete && (index === currentIndex + 1)
                return (
                  <li key={step.key} aria-current={current ? "step" : undefined} className="relative flex items-center gap-3 pb-4 last:pb-0">
                    {index < timeline.length - 1 ? (
                      <span aria-hidden="true" className="absolute top-6 left-[11px] h-[calc(100%-1rem)] w-1 rounded-full bg-lilac" />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative size-6 shrink-0 rounded-full border-[3px]",
                        complete ? "border-ink bg-ink" : current ? "border-ink bg-coral" : "border-ink bg-surface"
                      )}
                    />
                    <span className={cn("flex-1", complete || current ? "font-bold text-ink" : "text-ink-muted")}>{step.label}</span>
                    <span className="text-xs font-bold text-ink-muted">{complete ? "Done" : current ? "Next" : ""}</span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section aria-labelledby="actions-heading" className="bb-card p-5">
            <h2 id="actions-heading" className="text-title text-ink">What happens next</h2>
            <div className="mt-4">
              <BookingActions bookingId={booking.id} status={booking.status} actor={actor} borrowerWouldHaveBought={booking.borrower_would_have_bought} />
            </div>
            {returned && booking.borrower_would_have_bought ? (
              <p className="mt-4 text-sm text-ink-muted">
                Would have bought or rented it otherwise: <strong className="text-ink capitalize">{booking.borrower_would_have_bought}</strong>
              </p>
            ) : null}
          </section>

          {booking.handover_note || booking.return_note ? (
            <section className="flex flex-col gap-2">
              {booking.handover_note ? <p className="rounded-lg bg-lilac-tint p-3 text-sm text-ink"><strong>Handover note:</strong> {booking.handover_note}</p> : null}
              {booking.return_note ? <p className="rounded-lg bg-lilac-tint p-3 text-sm text-ink"><strong>Return note:</strong> {booking.return_note}</p> : null}
            </section>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <BookingChat bookingId={booking.id} messages={messagesResult.data ?? []} currentUserId={active.user.id} />
          <div className="rounded-lg bg-mint-tint p-4 text-sm text-ink">
            <p className="font-bold">Stay safe</p>
            <p className="mt-1">Meet in shared spaces. Never share bank or ID details. Report an issue from this booking if something feels wrong.</p>
          </div>
          <BlockUserButton blockedId={otherUserId} name="other participant" />
        </div>
      </div>
    </div>
  )
}
