/** Optional Home sections must not turn a service failure into a page failure. */
export async function settleSection<
  T extends { data: unknown; error: unknown },
>(query: PromiseLike<T>) {
  try {
    return await query
  } catch {
    return {
      data: null,
      error: { message: "Section unavailable" },
      count: null,
    }
  }
}

export type NextBooking = {
  id: string
  status: string
  borrower_id: string
  lender_id: string
  end_date: string
  borrower_handover_confirmed_at: string | null
  lender_handover_confirmed_at: string | null
  borrower_return_marked_at: string | null
  items: { title: string } | null
}

export function bookingNextStep(booking: NextBooking, userId: string) {
  const lender = booking.lender_id === userId
  if (booking.status === "requested") return lender ? "Review request" : null
  if (booking.status === "approved") {
    return (
      lender
        ? booking.lender_handover_confirmed_at
        : booking.borrower_handover_confirmed_at
    )
      ? null
      : "Confirm handover"
  }
  if (booking.status === "handed_over") {
    if (booking.borrower_return_marked_at)
      return lender ? "Confirm return" : null
    return lender ? null : "Arrange return"
  }
  return null
}
