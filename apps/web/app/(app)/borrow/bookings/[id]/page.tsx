import { notFound } from "next/navigation"

import { HandoverSteps } from "@/components/block/handover-steps"
import { BookingActions } from "@/components/borrow/booking-actions"
import { BookingChat } from "@/components/borrow/booking-chat"
import { HandoverPanel } from "@/components/borrow/handover-panel"
import { BlockUserButton } from "@/components/reports/block-user-button"
import { PageBand } from "@/components/shared/page-band"
import { RealtimeRefresh } from "@/components/shared/realtime-refresh"
import { requireActiveMember } from "@/lib/data"
import { formatEventDate } from "@/lib/format"
import { resolveRewardRule } from "@/lib/points"
import { createClient } from "@/lib/supabase/server"
import { StatusPill } from "@/components/shared/status-pill"

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
      .select(
        "id,status,start_date,end_date,handover_method,handover_note,return_note,borrower_id,lender_id,borrower_would_have_bought,return_condition,return_condition_reason,condition_contest_ends_at,deposit_amount_rm,deposit_waived,borrower_handover_confirmed_at,lender_handover_confirmed_at,borrower_return_marked_at,lender_return_confirmed_at,items(id,title,photo_paths,estimated_new_price_rm,item_categories(name,slug,typical_new_price_rm))"
      )
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
  const isParticipant =
    booking.borrower_id === active.user.id ||
    booking.lender_id === active.user.id
  const rulesResult = await supabase
    .from("reward_rules")
    .select("township_id,action_type,category_slug,points")
    .eq("active", true)
    .or(`township_id.is.null,township_id.eq.${active.townshipId}`)
  const category = booking.items?.item_categories?.slug ?? null
  const lendReward = resolveRewardRule(
    rulesResult.data ?? [],
    "item_lent_completed",
    category
  )?.points
  const returnReward = resolveRewardRule(
    rulesResult.data ?? [],
    "item_returned_on_time",
    category
  )?.points
  const actor = booking.borrower_id === active.user.id ? "borrower" : "lender"
  const otherUserId =
    booking.borrower_id === active.user.id
      ? booking.lender_id
      : booking.borrower_id
  const returned = Boolean(booking.borrower_return_marked_at)
  const guideResult = await supabase
    .from("item_guides")
    .select("id")
    .eq("item_id", booking.items?.id ?? "")
    .maybeSingle()
  const hasGuide = Boolean(guideResult.data)
  const disputeResult = await supabase
    .from("disputes")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("kind", "condition")
    .eq("status", "open")
    .maybeSingle()
  const canContest =
    actor === "borrower" &&
    booking.return_condition === "damaged" &&
    Boolean(booking.condition_contest_ends_at) &&
    new Date(booking.condition_contest_ends_at ?? 0) > new Date() &&
    !disputeResult.data
  const estimatedShared = Number(
    booking.items?.estimated_new_price_rm ??
      booking.items?.item_categories?.typical_new_price_rm ??
      0
  )

  const range = `${formatEventDate(booking.start_date).replace(/ \d{4}$/, "")} – ${formatEventDate(booking.end_date).replace(/ \d{4}$/, "")}`

  return (
    <div className="w-full">
      <RealtimeRefresh
        table="booking_messages"
        filter={`booking_id=eq.${id}`}
      />
      <PageBand
        back={{ href: "/borrow/mine", label: "Borrowing and lending" }}
        eyebrow={`Pinjam · ${actor === "borrower" ? "You're borrowing" : "You're lending"}`}
        title={booking.items?.title ?? "Borrowing request"}
        description={`${range} · ${booking.handover_method}`}
        actions={
          <StatusPill status={booking.status} className="px-3 py-1 text-sm" />
        }
      />

      <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="progress-heading" className="bb-card p-5">
            <h2 id="progress-heading" className="text-title text-ink">
              Progress
            </h2>
            <div className="mt-4">
              <HandoverSteps
                completed={
                  booking.status === "completed"
                    ? [0, 1, 2]
                    : booking.status === "handed_over"
                      ? [0, 1]
                      : booking.status === "approved"
                        ? [0]
                        : []
                }
                currentStep={
                  booking.status === "completed" ||
                  booking.status === "handed_over"
                    ? 2
                    : booking.status === "approved"
                      ? 1
                      : 0
                }
              />
            </div>
          </section>

          <section aria-labelledby="actions-heading" className="bb-card p-5">
            <h2 id="actions-heading" className="text-title text-ink">
              What happens next
            </h2>
            <div className="mt-4">
              {isParticipant ? (
                <>
                  <BookingActions
                    bookingId={booking.id}
                    status={booking.status}
                    actor={actor}
                    borrowerWouldHaveBought={booking.borrower_would_have_bought}
                    handoverConfirmed={Boolean(
                      actor === "borrower"
                        ? booking.borrower_handover_confirmed_at
                        : booking.lender_handover_confirmed_at
                    )}
                    hasGuide={hasGuide}
                    canContest={canContest}
                  />
                  <HandoverPanel
                    bookingId={booking.id}
                    status={booking.status}
                    actor={actor}
                    hasGuide={hasGuide}
                  />
                </>
              ) : (
                <p className="text-sm text-ink-muted">
                  Township office review. Only the borrower and lender can
                  confirm this loan.
                </p>
              )}
              <p className="mt-4 text-sm text-ink-muted">
                {lendReward == null
                  ? "Lender reward follows township rules"
                  : `Up to ${lendReward} BP for the lender`}{" "}
                after confirmed return.{" "}
                {returnReward == null
                  ? "On-time return reward follows township rules"
                  : `Up to ${returnReward} BP for the borrower on an on-time confirmed return`}
                . Daily and weekly caps apply. Requests and approvals earn no
                points.
              </p>
            </div>
            {returned && booking.borrower_would_have_bought ? (
              <p className="mt-4 text-sm text-ink-muted">
                Would have bought or rented it otherwise:{" "}
                <strong className="text-ink capitalize">
                  {booking.borrower_would_have_bought}
                </strong>
              </p>
            ) : null}
            {booking.status === "completed" && estimatedShared > 0 ? (
              <p className="mt-4 rounded-lg bg-sun-tint p-3 text-sm text-ink">
                <strong>
                  Estimated value shared: RM{" "}
                  {Math.round(estimatedShared).toLocaleString("en-MY")}
                </strong>{" "}
                compared with buying this item. Estimated, not a guaranteed
                saving.
              </p>
            ) : null}
            {booking.return_condition ? (
              <p className="mt-4 text-sm text-ink-muted">
                Return condition:{" "}
                <strong className="text-ink capitalize">
                  {booking.return_condition.replace("_", " ")}
                </strong>
                {booking.return_condition_reason
                  ? ` · ${booking.return_condition_reason}`
                  : ""}
              </p>
            ) : null}
          </section>

          {booking.handover_note || booking.return_note ? (
            <section className="flex flex-col gap-2">
              {booking.handover_note ? (
                <p className="rounded-lg bg-lilac-tint p-3 text-sm text-ink">
                  <strong>Handover note:</strong> {booking.handover_note}
                </p>
              ) : null}
              {booking.return_note ? (
                <p className="rounded-lg bg-lilac-tint p-3 text-sm text-ink">
                  <strong>Return note:</strong> {booking.return_note}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <BookingChat
            bookingId={booking.id}
            messages={messagesResult.data ?? []}
            currentUserId={active.user.id}
          />
          <div className="rounded-lg bg-mint-tint p-4 text-sm text-ink">
            <p className="font-bold">Stay safe</p>
            <p className="mt-1">
              Meet in shared spaces. Never share bank or ID details. Report an
              issue from this booking if something feels wrong.
            </p>
          </div>
          {isParticipant ? (
            <BlockUserButton blockedId={otherUserId} name="other participant" />
          ) : null}
        </div>
      </div>
    </div>
  )
}
