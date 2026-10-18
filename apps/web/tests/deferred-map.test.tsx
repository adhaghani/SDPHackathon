import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DeferredMap } from "@/components/map/deferred-map"

afterEach(() => vi.unstubAllGlobals())

describe("deferred map loading", () => {
  it("mounts the map only when it approaches the viewport", () => {
    let notify: IntersectionObserverCallback
    const disconnect = vi.fn()
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback
        }
        observe = vi.fn()
        disconnect = disconnect
      }
    )
    render(
      <DeferredMap placeholderClassName="h-72">
        <div>Interactive map</div>
      </DeferredMap>
    )
    expect(screen.queryByText("Interactive map")).not.toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Loading map" })).toBeVisible()
    act(() =>
      notify(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    )
    expect(screen.getByText("Interactive map")).toBeVisible()
    expect(disconnect).toHaveBeenCalled()
  })
  it("loads normally when IntersectionObserver is unavailable", () => {
    render(
      <DeferredMap placeholderClassName="h-72">
        <div>Interactive map</div>
      </DeferredMap>
    )
    expect(screen.getByText("Interactive map")).toBeVisible()
  })
})
