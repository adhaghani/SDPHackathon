// Cache only global reference tables. Auth, RPCs, writes and resident data keep
// Supabase's normal fetch behaviour.
const REFERENCE_TABLES = new Set([
  "item_categories",
  "event_categories",
  "levels",
  "badges",
  "recycling_materials",
  "recycling_units",
])

export const REFERENCE_CACHE_SECONDS = 3600

export function referenceCacheTag(table: string) {
  return `reference:${table}`
}

export function createReferenceFetch(supabaseUrl: string): typeof fetch {
  const origin = new URL(supabaseUrl).origin

  return (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    )
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET")
    const cache =
      init?.cache ?? (input instanceof Request ? input.cache : undefined)
    const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1]

    if (
      url.origin !== origin ||
      method.toUpperCase() !== "GET" ||
      !table ||
      !REFERENCE_TABLES.has(table) ||
      cache === "no-store" ||
      init?.next?.revalidate === 0
    ) {
      return fetch(input, init)
    }

    // Next's cache key includes the URL and headers, preserving query filters
    // and Authorization. Entries cannot be reused by a different session.
    return fetch(input, {
      ...init,
      cache: "force-cache",
      next: {
        ...init?.next,
        revalidate: REFERENCE_CACHE_SECONDS,
        tags: [...(init?.next?.tags ?? []), referenceCacheTag(table)],
      },
    })
  }
}
