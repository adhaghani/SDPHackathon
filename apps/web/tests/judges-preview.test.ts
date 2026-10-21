// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { initialPreviewState, parsePreviewState } from "@/lib/judges/seed"

const createClient = vi.hoisted(() => vi.fn())
vi.mock("@supabase/ssr", () => ({ createServerClient: createClient }))
import { proxy } from "@/proxy"

describe("judges deployment isolation", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_JUDGES_PREVIEW", "true")
    createClient.mockClear()
  })
  afterEach(() => vi.unstubAllEnvs())
  it.each([
    "/",
    "/preview/resident",
    "/preview/manager",
    "/preview/guard",
    "/preview/event",
    "/images/township-garden.webp",
  ])("serves %s without constructing a database client", async (path) => {
    const result = await proxy(
      new NextRequest(`https://judges.borrowlah.my${path}`)
    )
    expect(result.status).toBe(200)
    expect(result.headers.get("x-robots-tag")).toBe("noindex, nofollow")
    expect(createClient).not.toHaveBeenCalled()
  })
  it.each([
    "/admin",
    "/home",
    "/guard",
    "/auth/callback",
    "/pass/real-token",
    "/brief",
  ])("redirects live route %s to the judges overview", async (path) => {
    const result = await proxy(
      new NextRequest(`https://judges.borrowlah.my${path}`)
    )
    expect(result.headers.get("location")).toBe("https://judges.borrowlah.my/")
    expect(createClient).not.toHaveBeenCalled()
  })
  it.each([
    ["GET", "/api/health"],
    ["POST", "/"],
    ["POST", "/preview/resident"],
    ["POST", "/borrow"],
    ["DELETE", "/api/profile"],
    ["OPTIONS", "/api/export"],
  ])("blocks %s %s", async (method, path) => {
    const result = await proxy(
      new NextRequest(`https://judges.borrowlah.my${path}`, { method })
    )
    expect(result.status).toBe(403)
    expect(await result.json()).toEqual({
      error: expect.stringContaining("not connected to a database"),
    })
    expect(createClient).not.toHaveBeenCalled()
  })
})

describe("demo session recovery", () => {
  it.each([
    null,
    "broken",
    "null",
    "[]",
    '{"version":2}',
    JSON.stringify({ ...initialPreviewState, bookings: { washer: 99 } }),
    JSON.stringify({ ...initialPreviewState, inside: "invalid" }),
  ])("restores a clean seed for invalid storage %s", (value) => {
    expect(parsePreviewState(value)).toEqual(initialPreviewState)
  })
  it("retains valid progress when switching perspectives", () => {
    const state = {
      ...initialPreviewState,
      bookings: { washer: 6 },
      rsvp: true,
      checkedIn: ["aisyah"],
      membership: "approved",
    }
    expect(parsePreviewState(JSON.stringify(state))).toEqual(state)
  })
})
