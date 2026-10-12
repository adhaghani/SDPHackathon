const CACHE_NAME = "borrowbetter-handover-v1"
const OFFLINE_URL = "/offline/handover"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

// Cache only the booking handover shell and its static assets. API responses,
// Server Actions, authenticated data and tokens are never cached as HTTP data.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (
    event.request.mode !== "navigate" &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css"))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.ok) await cache.put(event.request, response.clone())
        return response
      })
    )
    return
  }

  if (event.request.mode !== "navigate") return
  const isHandover = url.pathname.startsWith("/borrow/bookings/")
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request)
        if (isHandover && response.ok) await cache.put(event.request, response.clone())
        return response
      } catch {
        if (isHandover) {
          const cached = await cache.match(event.request)
          if (cached) return cached
        }
        const offline = await cache.match(OFFLINE_URL)
        if (offline) return offline
        throw new Error("offline_fallback_unavailable")
      }
    })
  )
})
