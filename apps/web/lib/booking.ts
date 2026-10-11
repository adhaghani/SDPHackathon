export type BookingStatus =
  | "requested"
  | "approved"
  | "declined"
  | "cancelled"
  | "handed_over"
  | "completed"
  | "disputed"
  | "closed"

export type BookingAction =
  | "approve"
  | "decline"
  | "cancel"
  | "confirm_handover"
  | "mark_returned"
  | "confirm_return"
  | "open_dispute"
  | "resolve_dispute"

export type BookingActor = "borrower" | "lender" | "admin"

export function canTransitionBooking({
  status,
  action,
  actor,
  borrowerReturnMarked = false,
}: {
  status: BookingStatus
  action: BookingAction
  actor: BookingActor
  borrowerReturnMarked?: boolean
}): boolean {
  if (status === "requested" && action === "approve") return actor === "lender"
  if (status === "requested" && action === "decline") return actor === "lender"
  if ((status === "requested" || status === "approved") && action === "cancel") {
    return actor === "borrower" || (actor === "lender" && status === "approved")
  }
  if (status === "approved" && action === "confirm_handover") {
    return actor === "borrower" || actor === "lender"
  }
  if (status === "handed_over" && action === "mark_returned") return actor === "borrower"
  if (status === "handed_over" && action === "confirm_return") {
    return actor === "lender" && borrowerReturnMarked
  }
  if ((status === "handed_over" || status === "completed") && action === "open_dispute") {
    return actor === "borrower" || actor === "lender"
  }
  if (status === "disputed" && action === "resolve_dispute") return actor === "admin"
  return false
}
