import "server-only"

import { getSecretKey, isFeatureEnabled } from "@/lib/env"
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
  const expiresInSeconds = isFeatureEnabled("rotating_qr") ? 60 : 90
  return createTicketToken({ rsvp: rsvpId, evt: eventId, usr: userId }, getSecretKey(), expiresInSeconds)
}

export async function verifyTicketToken(token: string): Promise<{
  rsvp: string
  evt: string
  usr: string
}> {
  return readTicketToken(token, getSecretKey())
}
