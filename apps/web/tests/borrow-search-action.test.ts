import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireActiveMember: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("@/lib/data", () => ({ requireActiveMember: mocks.requireActiveMember }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url)
    throw new Error(`redirect:${url}`)
  },
}))

import { searchBorrowItems } from "@/actions/borrow"

const { requireActiveMember, createClient, revalidatePath, redirect } = mocks

function createCountQuery(count: number) {
  const query = {
    count,
    error: null,
    eq: vi.fn(() => query),
    ilike: vi.fn(() => query),
    then: vi.fn((resolve: (value: unknown) => void) =>
      resolve({ count, error: null })
    ),
  }
  return query
}

describe("searchBorrowItems", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireActiveMember.mockResolvedValue({
      townshipId: "township-1",
      membership: { neighbourhood_id: "neighbourhood-1" },
    })
  })

  it("normalizes the term, logs privacy-safe aggregate counts and redirects", async () => {
    const query = createCountQuery(3)
    const rpc = vi.fn().mockResolvedValue({ error: null })
    createClient.mockResolvedValue({
      from: vi.fn(() => ({ select: vi.fn(() => query) })),
      rpc,
    })
    redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`)
    })

    const formData = new FormData()
    formData.set("q", "  TANGGA ")
    formData.set("free", "true")

    await expect(searchBorrowItems(formData)).rejects.toThrow(
      "redirect:/borrow?q=TANGGA&free=true"
    )

    expect(query.ilike).toHaveBeenCalledWith("title", "%ladder%")
    expect(rpc).toHaveBeenCalledWith("log_borrow_search", {
      p_township_id: "township-1",
      p_neighbourhood_id: "neighbourhood-1",
      p_term: "ladder",
      p_category_id: undefined,
      p_results_count: 3,
      p_available_count: 3,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/borrow")
  })

  it("redirects invalid searches without logging personal or malformed input", async () => {
    const rpc = vi.fn()
    createClient.mockResolvedValue({ from: vi.fn(), rpc })
    redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`)
    })

    const formData = new FormData()
    formData.set("q", "x".repeat(101))

    await expect(searchBorrowItems(formData)).rejects.toThrow("redirect:/borrow")
    expect(rpc).not.toHaveBeenCalled()
    expect(requireActiveMember).not.toHaveBeenCalled()
  })
})
