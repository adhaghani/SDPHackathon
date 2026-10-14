import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock("@/lib/data", () => ({
  requireActiveMember: async () => ({
    user: { id: "resident" },
    townshipId: "township",
    membership: { townships: { name: "Test township" } },
    profile: { display_name: "Neighbour" },
    points: { balance: 10 },
  }),
}))
vi.mock("@/lib/saved-items", () => ({ getSavedItemIds: async () => [] }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("@/components/block/intent-composer", () => ({
  IntentComposer: () => null,
}))
vi.mock("@/components/borrow/saved-items-section", () => ({
  SavedItemsSection: () => null,
}))
vi.mock("@/components/block/feed-card", () => ({
  FeedCard: ({ title, href }: { title: string; href: string }) => (
    <a href={href}>{title}</a>
  ),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    from: (table: string) => {
      const data =
        table === "items"
          ? [
              {
                id: "drill",
                title: "Neighbour's drill",
                owner_id: "lender",
                deposit_rm: 0,
                max_loan_days: 3,
              },
            ]
          : table === "events"
            ? [
                {
                  id: "event",
                  title: "Garden day",
                  starts_at: "2099-10-14T10:00:00Z",
                  event_categories: { slug: "social" },
                },
              ]
            : []
      const chain = {
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data, error: null, count: 0 }).then(resolve),
      } as Record<string, unknown>
      for (const method of [
        "select",
        "eq",
        "neq",
        "gte",
        "in",
        "or",
        "order",
        "limit",
      ])
        chain[method] = () => chain
      return chain
    },
  }),
}))

import HomePage from "@/app/(app)/home/page"

describe("Home partial service failure", () => {
  it.each(["error response", "rejected request"])(
    "keeps borrowing and events usable after a recycling %s",
    async (failure) => {
      mocks.rpc.mockImplementation(() =>
        failure === "rejected request"
          ? Promise.reject(new Error("recycling unavailable"))
          : Promise.resolve({
              data: null,
              error: { message: "recycling unavailable" },
            })
      )
      render(await HomePage())
      expect(
        screen.getByRole("link", { name: "Neighbour's drill" })
      ).toHaveAttribute("href", "/borrow/items/drill")
      expect(screen.getByRole("link", { name: "Garden day" })).toHaveAttribute(
        "href",
        "/events/event"
      )
      expect(
        screen.getByRole("button", { name: "Retry your recycling impact" })
      ).toBeVisible()
      expect(
        screen.getByRole("button", { name: "Retry township recycling goal" })
      ).toBeVisible()
    }
  )
})
