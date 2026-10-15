import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.setTimeout(120_000)
for (const width of [390, 1440]) {
  test(`badge requirements and office editing at ${width}px`, async ({
    browser,
  }) => {
    const resident = await browser.newContext({
      viewport: { width, height: 900 },
    })
    const office = await browser.newContext({
      viewport: { width, height: 900 },
    })
    try {
      const page = await resident.newPage()
      await page.goto("/")
      await page.getByRole("button", { name: "Aisyah · resident" }).click()
      await page.waitForURL(/\/home/)
      await page.goto("/rewards")
      const badges = page
        .getByRole("heading", { name: "Badges", exact: true })
        .locator("..")
      await expect(
        badges.getByRole("button", { name: /badge details$/ })
      ).toHaveCount(9)
      const manual = badges
        .locator("li")
        .filter({ hasText: "Neighbour of the month" })
      await manual
        .getByRole("button", { name: "Neighbour of the month badge details" })
        .click()
      await expect(
        page.getByRole("dialog").getByText(/not earned automatically/)
      ).toBeVisible()
      await expect(manual.getByRole("progressbar")).toHaveCount(0)
      await page.keyboard.press("Escape")
      await expect(page.getByRole("dialog")).toHaveCount(0)
      await expect(
        manual.getByRole("button", {
          name: "Neighbour of the month badge details",
        })
      ).toBeFocused()
      const progressBars = badges.getByRole("progressbar")
      expect(await progressBars.count()).toBeGreaterThan(0)
      await badges.screenshot({ path: `/tmp/borrowlah-badges-${width}.png` })
      expect(
        (await new AxeBuilder({ page }).include("#main-content").analyze())
          .violations
      ).toEqual([])
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.goto("/profile")
      const earned = page
        .getByRole("heading", { name: "Badges earned" })
        .locator("..", {
          has: page.getByRole("heading", { name: "Badges earned" }),
        })
        .locator("..")
      const earnedTrigger = earned
        .getByRole("button", { name: /badge details$/ })
        .first()
      await earnedTrigger.click()
      const earnedDialog = page.getByRole("dialog")
      await expect(earnedDialog.locator("time")).toBeVisible()
      await expect(
        earnedDialog.getByText("How you earned it", { exact: true })
      ).toBeVisible()
      const detailsWidth = await earnedDialog.evaluate(
        (element) => element.getBoundingClientRect().width
      )
      expect(detailsWidth).toBeGreaterThan(200)
      await earnedDialog.screenshot({
        path: `/tmp/borrowlah-earned-badge-${width}.png`,
      })
      expect(
        (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
          .violations
      ).toEqual([])
      await page.keyboard.press("Escape")
      await expect(earnedTrigger).toBeFocused()

      const admin = await office.newPage()
      await admin.goto("/")
      await admin
        .getByRole("button", { name: "Township office · admin" })
        .click()
      await admin.waitForURL(/\/admin/)
      await admin.goto("/admin/badges")
      await admin.getByLabel("Award to edit").selectOption("eco-warrior")
      await expect(admin.getByLabel("Slug", { exact: true })).toHaveValue(
        "eco-warrior"
      )
      await expect(
        admin.getByRole("checkbox", {
          name: "Change earning requirements",
          exact: true,
        })
      ).not.toBeChecked()
      await admin
        .getByRole("button", { name: "Save award", exact: true })
        .click()
      await expect(
        admin.getByText("Award saved.", { exact: true })
      ).toBeVisible()
      await admin
        .getByRole("checkbox", {
          name: "Change earning requirements",
          exact: true,
        })
        .check()
      await expect(
        admin.getByLabel("Qualifying activities required")
      ).toHaveValue("5")
      await expect(
        admin.getByRole("checkbox", {
          name: "Only activities marked as sustainability count",
          exact: true,
        })
      ).toBeChecked()
      await admin
        .getByRole("button", { name: "Save award", exact: true })
        .click()
      await expect(
        admin.getByText("Award saved.", { exact: true })
      ).toBeVisible()
      await admin.getByLabel("Award to edit").selectOption("reliable-returner")
      await admin
        .getByRole("checkbox", {
          name: "Change earning requirements",
          exact: true,
        })
        .check()
      await expect(
        admin.getByLabel("How residents earn this badge")
      ).toHaveValue("consecutive_recent")
      await expect(
        admin.getByLabel("Consecutive on-time returns required")
      ).toHaveValue("10")
      await admin
        .getByRole("button", { name: "Save award", exact: true })
        .click()
      await expect(
        admin.getByText("Award saved.", { exact: true })
      ).toBeVisible()
      expect(
        (
          await new AxeBuilder({ page: admin })
            .include("#main-content")
            .analyze()
        ).violations
      ).toEqual([])
      await admin.screenshot({
        path: `/tmp/borrowlah-badge-admin-${width}.png`,
        fullPage: true,
      })
    } finally {
      await resident.close()
      await office.close()
    }
  })
}
