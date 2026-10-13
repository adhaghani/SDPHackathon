import "server-only"

import { cookies } from "next/headers"

const MAX_SAVED_ITEMS = 60
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function savedItemsCookieName(userId: string) {
  return `saved_item_ids_${userId}`
}

function normalizeSavedItemIds(value: string | undefined) {
  if (!value) return []

  const seen = new Set<string>()
  const ids: string[] = []

  for (const rawId of value.split(",")) {
    const id = rawId.trim()
    if (!UUID_PATTERN.test(id) || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length >= MAX_SAVED_ITEMS) break
  }

  return ids
}

export function parseSavedItemIds(value: string | undefined) {
  return normalizeSavedItemIds(value)
}

export async function getSavedItemIds(userId: string) {
  const cookieStore = await cookies()
  return normalizeSavedItemIds(
    cookieStore.get(savedItemsCookieName(userId))?.value
  )
}

export async function setSavedItemIds(userId: string, ids: string[]) {
  const cookieStore = await cookies()
  const normalized = normalizeSavedItemIds(ids.join(","))
  const name = savedItemsCookieName(userId)

  if (!normalized.length) {
    cookieStore.set(name, "", {
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    })
    return []
  }

  cookieStore.set(name, normalized.join(","), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
  })
  return normalized
}
