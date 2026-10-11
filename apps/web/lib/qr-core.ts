import { jwtVerify, SignJWT } from "jose"
import { TextEncoder } from "node:util"

const encoder = new TextEncoder()

export async function createTicketToken(
  payload: { rsvp: string; evt: string; usr: string },
  secret: string,
  expiresInSeconds = 90
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ typ: "ticket", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(encoder.encode(secret))
}

export async function readTicketToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, encoder.encode(secret))
  if (
    payload.typ !== "ticket" ||
    typeof payload.rsvp !== "string" ||
    typeof payload.evt !== "string" ||
    typeof payload.usr !== "string"
  ) {
    throw new Error("invalid_ticket")
  }
  return { rsvp: payload.rsvp, evt: payload.evt, usr: payload.usr }
}
