import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { AnchorHTMLAttributes } from "react"

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a {...props} data-prefetch={String(prefetch)} />
  ),
}))
import { IntentLink } from "@/components/shared/intent-link"

describe("intent-based route prefetch", () => {
  it("waits for pointer intent and preserves the caller handler", () => {
    const onPointerEnter = vi.fn()
    render(
      <IntentLink href="/borrow" onPointerEnter={onPointerEnter}>
        Borrow
      </IntentLink>
    )
    const link = screen.getByRole("link", { name: "Borrow" })
    expect(link).toHaveAttribute("data-prefetch", "false")
    fireEvent.pointerEnter(link)
    expect(link).toHaveAttribute("data-prefetch", "true")
    expect(onPointerEnter).toHaveBeenCalledTimes(1)
  })
  it("prefetches on keyboard focus", () => {
    render(<IntentLink href="/events">Events</IntentLink>)
    const link = screen.getByRole("link", { name: "Events" })
    fireEvent.focus(link)
    expect(link).toHaveAttribute("data-prefetch", "true")
  })
  it("honours an explicit disabled prefetch", () => {
    render(
      <IntentLink href="/profile" prefetch={false}>
        Profile
      </IntentLink>
    )
    const link = screen.getByRole("link", { name: "Profile" })
    fireEvent.focus(link)
    expect(link).toHaveAttribute("data-prefetch", "false")
  })
})
