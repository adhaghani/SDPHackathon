// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

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
      getUser: async () => {
        if (mocks.refresh)
          options.cookies.setAll([
            {
              name: "refreshed-session",
              value: "new-session",
              options: { path: "/" },
            },
          ])
        return { data: { user: mocks.user } }
      },
    },
  }),
}))
import { proxy } from "@/proxy"

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
})
