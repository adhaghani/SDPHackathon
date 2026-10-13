import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

const shortCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export type GuestPassSecrets = {
  token: string
  tokenHash: string
  shortCode: string
  shortCodeHash: string
}

export function createGuestPassSecrets(): GuestPassSecrets {
  const token = randomBytes(16).toString("base64url")
  const shortCode = Array.from({ length: 8 }, () => {
    const bytes = randomBytes(1)
    return shortCodeAlphabet[(bytes[0] ?? 0) % shortCodeAlphabet.length]
  }).join("")

  return {
    token,
    tokenHash: sha256Hex(token),
    shortCode,
    shortCodeHash: sha256Hex(shortCode),
  }
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function hashToByteaInput(hex: string): string {
  return `\\x${hex}`
}

export function compareHashHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex")
  const rightBuffer = Buffer.from(right, "hex")
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
