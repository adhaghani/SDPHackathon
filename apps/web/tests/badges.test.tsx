import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BadgeCard } from "@/components/rewards/badge-card"
import { badgeRequirements } from "@/lib/badges"
import { badgeCriteriaSchema } from "@/lib/validation/badges"

describe("badge requirements", () => {
  it("rejects incomplete or impossible earning rules", () => {
    for (const rule of [
      { type: "count", threshold: 1, action_types: [] },
      { type: "count", threshold: 0, action_types: ["event_attendance"] },
      { type: "streak", threshold: 121 },
      { type: "sustained", min_types: 3, min_active_weeks: 8, window_weeks: 4 },
      {
        type: "consecutive_recent",
        threshold: 10,
        action_type: "event_attendance",
      },
    ])
      expect(badgeCriteriaSchema.safeParse(rule).success).toBe(false)
  })

  it("preserves metadata conditions while validating a count rule", () => {
    const rule = {
      type: "count",
      threshold: 5,
      action_types: ["event_attendance"],
      metadata: { counts_as_sustainability: true },
    }
    expect(badgeCriteriaSchema.parse(rule)).toEqual(rule)
    expect(badgeRequirements(rule)).toContain(
      "Only activities marked as sustainability count"
    )
  })

  it("describes manual and historic awards without inventing a progress target", () => {
    expect(badgeRequirements({ type: "manual" })).toContain(
      "not earned automatically"
    )
    expect(badgeRequirements(null)).toContain("original earning requirements")
  })
})

describe("badge disclosure", () => {
  it("shows concrete progress and opens the requirements in a dialog", async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <BadgeCard
          name="Good neighbour"
          description="Sharing helps your block."
          icon="hand-heart"
          earned={false}
          criteria={{
            type: "count",
            threshold: 5,
            action_types: ["item_lent_completed"],
          }}
          progress={{
            type: "count",
            percent: 60,
            eligible: false,
            requirements: [{ current: 3, target: 5, label: "completed lends" }],
          }}
        />
      </ul>
    )
    expect(screen.getByText("3 of 5 completed lends")).toBeVisible()
    expect(
      screen.getByRole("progressbar", { name: "Good neighbour progress" })
    ).toHaveAttribute("aria-valuenow", "60")
    const trigger = screen.getByRole("button", {
      name: "Good neighbour badge details",
    })
    await user.click(trigger)
    expect(screen.getByRole("dialog", { name: "Good neighbour" })).toBeVisible()
    expect(screen.getByText("Sharing helps your block.")).toBeVisible()
    await user.keyboard("{Escape}")
    expect(trigger).toHaveFocus()
  })

  it("shows the earned date and original requirements after later rule changes", async () => {
    render(
      <ul>
        <BadgeCard
          name="Helper"
          description="A helping hand."
          icon="award"
          earned
          earnedAt="2026-10-15T00:00:00Z"
          criteria={{
            type: "count",
            threshold: 20,
            action_types: ["help_completed"],
          }}
          earnedCriteria={{
            type: "count",
            threshold: 5,
            action_types: ["help_completed"],
          }}
        />
      </ul>
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Helper badge details" })
    )
    expect(screen.getByText(/Complete 5 qualifying activities/)).toBeVisible()
    expect(screen.getByText(/Complete 20 qualifying activities/)).toBeVisible()
    expect(screen.getByText(/Thu, 15 Oct 2026/)).toBeVisible()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("shows office selection without a numeric progress bar", () => {
    render(
      <ul>
        <BadgeCard
          name="Neighbour of the month"
          description="For verified helpful action."
          icon="award"
          earned={false}
          criteria={{ type: "manual" }}
          progress={{
            type: "manual",
            percent: null,
            eligible: false,
            requirements: [],
            note: "Selected by the township office.",
          }}
        />
      </ul>
    )
    expect(screen.getByText("Selected by the township office.")).toBeVisible()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })
})
