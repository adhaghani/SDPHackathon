import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn() },
  enabled: true,
  callbacks: [] as Array<() => void>,
  remove: vi.fn(),
}))
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }))
vi.mock("@/lib/env", () => ({ isRealtimeEnabled: () => mocks.enabled }))
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserClient: () => ({
    channel: () => {
      const channel = {
        on: (_event: unknown, _filter: unknown, callback: () => void) => {
          mocks.callbacks.push(callback)
          return channel
        },
        subscribe: () => channel,
      }
      return channel
    },
    removeChannel: mocks.remove,
  }),
}))
import { RealtimeRefresh } from "@/components/shared/realtime-refresh"

beforeEach(() => {
  vi.useFakeTimers()
  mocks.callbacks = []
  mocks.enabled = true
  vi.clearAllMocks()
})
afterEach(() => vi.useRealTimers())

describe("realtime refresh batching", () => {
  it("combines events across subscriptions without losing later updates", () => {
    const view = render(
      <>
        <RealtimeRefresh table="notifications" />
        <RealtimeRefresh table="points_ledger" />
      </>
    )
    act(() => {
      mocks.callbacks[0]!()
      mocks.callbacks[1]!()
      mocks.callbacks[0]!()
      vi.advanceTimersByTime(199)
    })
    expect(mocks.router.refresh).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(mocks.router.refresh).toHaveBeenCalledTimes(1)
    act(() => {
      mocks.callbacks[1]!()
      vi.advanceTimersByTime(200)
    })
    expect(mocks.router.refresh).toHaveBeenCalledTimes(2)
    view.unmount()
    expect(mocks.remove).toHaveBeenCalledTimes(2)
  })

  it("cancels pending work when subscriptions unmount", () => {
    const view = render(<RealtimeRefresh table="notifications" />)
    act(() => mocks.callbacks[0]!())
    view.unmount()
    act(() => vi.runAllTimers())
    expect(mocks.router.refresh).not.toHaveBeenCalled()
  })

  it("does not connect when realtime is disabled", () => {
    mocks.enabled = false
    render(<RealtimeRefresh table="notifications" />)
    expect(mocks.callbacks).toHaveLength(0)
  })
})
