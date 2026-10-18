// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { createReferenceFetch } from "@/lib/supabase/reference-fetch"

afterEach(() => vi.unstubAllGlobals())

describe("reference data cache boundaries", () => {
  it("preserves authorization, query shape and cancellation when caching catalogue reads", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]"))
    vi.stubGlobal("fetch", fetch)
    const signal = new AbortController().signal
    const url =
      "https://storage.test/rest/v1/item_categories?select=id,slug&kind=eq.item"
    const headers = new Headers({ Authorization: "Bearer resident-session" })
    await createReferenceFetch("https://storage.test")(url, { headers, signal })
    expect(fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers,
        signal,
        cache: "force-cache",
        next: { revalidate: 3600, tags: ["reference:item_categories"] },
      })
    )
  })

  it.each([
    ["https://storage.test/rest/v1/bookings", "GET"],
    ["https://storage.test/rest/v1/v_member_points", "GET"],
    ["https://storage.test/rest/v1/township_members", "GET"],
    ["https://storage.test/rest/v1/rpc/get_my_reward_stats", "POST"],
    ["https://storage.test/auth/v1/user", "GET"],
    ["https://other.test/rest/v1/badges", "GET"],
    ["https://storage.test/rest/v1/badges", "POST"],
  ])("does not persist %s %s", async (url, method) => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]"))
    vi.stubGlobal("fetch", fetch)
    const init = { method }
    await createReferenceFetch("https://storage.test")(url, init)
    expect(fetch).toHaveBeenCalledWith(url, init)
  })

  it("honours explicit no-store", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]"))
    vi.stubGlobal("fetch", fetch)
    const init = { cache: "no-store" as const }
    await createReferenceFetch("https://storage.test")(
      "https://storage.test/rest/v1/badges",
      init
    )
    expect(fetch).toHaveBeenCalledWith(
      "https://storage.test/rest/v1/badges",
      init
    )
  })
  it("honours no-store on Request objects and disabled revalidation", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response("[]")))
    vi.stubGlobal("fetch", fetch)
    const request = new Request("https://storage.test/rest/v1/badges", {
      cache: "no-store",
    })
    const fetchReference = createReferenceFetch("https://storage.test")
    await fetchReference(request)
    expect(fetch).toHaveBeenLastCalledWith(request, undefined)
    const init = { next: { revalidate: 0 } }
    await fetchReference(request.url, init)
    expect(fetch).toHaveBeenLastCalledWith(request.url, init)
  })
})
