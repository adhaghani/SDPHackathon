import "server-only"

import { getSecretKey } from "@/lib/env"
import { createTicketToken, readTicketToken } from "@/lib/qr-core"

export async function signTicketToken({
  rsvpId,
  eventId,
  userId,
}: {
  rsvpId: string
  eventId: string
  userId: string
}): Promise<string> {
  return createTicketToken({ rsvp: rsvpId, evt: eventId, usr: userId }, getSecretKey())
}

export async function verifyTicketToken(token: string): Promise<{
  rsvp: string
  evt: string
  usr: string
}> {
  return readTicketToken(token, getSecretKey())
}
