// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  refresh: false,
}))
vi.mock("@/lib/env", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getPublishableKey: () => "public-test-key",
}))
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          cookies: Array<{
            name: string
            value: string
            options: { path: string }
          }>
        ) => void
      }
    }
  ) => ({
    auth: {
      getClaims: async () => {
        if (mocks.refresh)
          options.cookies.setAll([
            {
              name: "refreshed-session",
              value: "new-session",
              options: { path: "/" },
            },
          ])
        return { data: mocks.user ? { claims: { sub: mocks.user.id } } : null }
      },
    },
  }),
}))
import { config, proxy } from "@/proxy"

describe("session proxy", () => {
  beforeEach(() => {
    mocks.user = null
    mocks.refresh = false
  })
  it("forwards refreshed cookies to both the current request and browser", async () => {
    mocks.user = { id: "resident" }
    mocks.refresh = true
    const request = new NextRequest("https://borrowlah.test/home")
    const response = await proxy(request)
    expect(request.cookies.get("refreshed-session")?.value).toBe("new-session")
    expect(response.cookies.get("refreshed-session")?.value).toBe("new-session")
  })
  it.each(["/home", "/borrow", "/recycling", "/giveaway", "/help", "/admin"])(
    "rejects signed-out access to %s",
    async (path) => {
      const response = await proxy(
        new NextRequest(`https://borrowlah.test${path}`)
      )
      expect(response.headers.get("location")).toBe(
        `https://borrowlah.test/sign-in?next=${encodeURIComponent(path)}`
      )
      expect(response.headers.get("cache-control")).toBe("private, no-store")
    }
  )
  it.each([
    "/brand/logo.svg",
    "/demo/item.webp",
    "/sw.js",
    "/_next/static/chunk.js",
    "/_next/image?url=photo",
    "/icons/icon.png",
  ])("skips auth work for public asset %s", (url) =>
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false)
  )
  it.each([
    "/home",
    "/borrow/items/123",
    "/pass/token",
    "/api/profile/export",
    "/auth/callback",
    "/sign-in",
  ])("retains session handling on %s", (url) =>
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true)
  )
})
