import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { TurtleProgressIllustration } from "@/components/recycling/turtle-progress-illustration"

const triggerName = "How the turtle shows recycling progress"

describe("turtle progress explanation", () => {
  it("opens on hover with a fully green goal preview and closes with Escape", async () => {
    const user = userEvent.setup()
    render(<TurtleProgressIllustration percent={42} hasCampaign />)

    const trigger = screen.getByRole("button", { name: triggerName })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.hover(trigger)

    const popup = await screen.findByRole("dialog", {
      name: "A greener shell, together",
    })
    expect(popup).toHaveTextContent(
      "At 100% of the goal, the shell is fully green!"
    )
    expect(popup).toHaveTextContent("100% · Goal reached")
    const fill = popup.querySelector("rect")
    expect(fill).toHaveStyle({ transform: "translateY(0px)" })

    await user.keyboard("{Escape}")
    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "false")
    )
  })

  it("opens by tapping the turtle and dismisses when tapping outside", async () => {
    const user = userEvent.setup()
    render(<TurtleProgressIllustration percent={0} hasCampaign={false} />)

    const trigger = screen.getByRole("button", { name: triggerName })
    await user.pointer([
      { keys: "[TouchA>]", target: trigger },
      { keys: "[/TouchA]", target: trigger },
    ])
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "When a township recycling goal is set"
    )

    await user.pointer([
      { keys: "[TouchA>]", target: document.body },
      { keys: "[/TouchA]", target: document.body },
    ])
    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "false")
    )
  })

  it("opens using the keyboard", async () => {
    const user = userEvent.setup()
    render(<TurtleProgressIllustration percent={100} hasCampaign />)

    await user.tab()
    expect(screen.getByRole("button", { name: triggerName })).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "100% · Goal reached"
    )
  })
})
