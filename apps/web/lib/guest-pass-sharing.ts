import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

import { getSecretKey } from "@/lib/env"

function encryptionKey() {
  return createHash("sha256").update(`guest-pass-sharing:v1:${getSecretKey()}`).digest()
}

export function encryptGuestPassCredentials(credentials: { token: string; shortCode: string }, hostId: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(hostId))
  const plaintext = JSON.stringify({ token: credentials.token, shortCode: credentials.shortCode })
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url")
}

export function decryptGuestPassCredentials(value: string, hostId: string): { token: string; shortCode: string } {
  const bytes = Buffer.from(value, "base64url")
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12))
  decipher.setAAD(Buffer.from(hostId))
  decipher.setAuthTag(bytes.subarray(12, 28))
  const credentials = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"))
  if (typeof credentials.token !== "string" || typeof credentials.shortCode !== "string") {
    throw new Error("Invalid guest pass credentials")
  }
  return { token: credentials.token, shortCode: credentials.shortCode }
}
