import { createHmac, timingSafeEqual } from "node:crypto"

export type HandoverTokenPayload = {
  typ: "booking_handover"
  booking: string
  jti: string
  iat: number
  exp: number
}

function base64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url")
}

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

export function createHandoverToken(payload: HandoverTokenPayload, secret: string): string {
  const encoded = base64Url(JSON.stringify(payload))
  return `${encoded}.${signature(encoded, secret)}`
}

export function verifyHandoverToken(token: string, secret: string, now = Date.now()): HandoverTokenPayload {
  const [encoded, provided] = token.split(".")
  if (!encoded || !provided) throw new Error("handover_token_invalid")
  const expected = signature(encoded, secret)
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("handover_token_invalid")
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HandoverTokenPayload
  if (
    payload.typ !== "booking_handover" ||
    typeof payload.booking !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp * 1000 <= now
  ) {
    throw new Error("handover_token_invalid")
  }
  return payload
}
