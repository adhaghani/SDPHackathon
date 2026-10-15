import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

for (const width of [390, 1440]) {
  test(`Help conversation works at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/")
    await page.getByRole("button", { name: "Aisyah · resident" }).click()
    await page.waitForURL(/\/home/)
    await page.goto("/help")
    await expect(
      page.getByRole("heading", { name: "Ask BorrowLah" })
    ).toBeVisible()
    await expect(
      page
        .getByLabel("Suggested questions")
        .getByRole("button", { name: "How do I borrow an item?", exact: true })
    ).toBeVisible()
    await page
      .getByLabel("Suggested questions")
      .getByRole("button", { name: "How do I borrow an item?", exact: true })
      .click()
    await expect(page.getByLabel("Help question", { exact: true })).toHaveValue(
      "How do I borrow an item?"
    )
    await page.getByLabel("Help question", { exact: true }).press("Enter")
    await expect(page.getByRole("status")).toContainText("Finding an answer")
    await expect(
      page
        .getByLabel("Chat messages")
        .getByText("How do I borrow an item?", { exact: true })
    ).toBeVisible()
    await expect(page).toHaveURL(/conversation=/, { timeout: 45_000 })
    await expect(
      page.getByLabel("Chat messages").locator('[data-slot="message"]')
    ).toHaveCount(2)
    await expect(
      page
        .getByLabel("Chat messages")
        .locator('[data-slot="bubble-content"]')
        .last()
    ).toContainText(/request|dates/i)
    await page.reload()
    await expect(
      page.getByLabel("Chat messages").locator('[data-slot="message"]')
    ).toHaveCount(2)
    if (width === 1440) {
      await page
        .getByLabel("Help question", { exact: true })
        .fill("What happens after approval?")
      await page.getByRole("button", { name: "Send message" }).click()
      await expect(
        page.getByLabel("Chat messages").locator('[data-slot="message"]')
      ).toHaveCount(4, { timeout: 45_000 })
      await expect(
        page
          .getByLabel("Chat messages")
          .locator('[data-slot="bubble-content"]')
          .last()
      ).toContainText(/handover|pickup/i)
    }
    await page
      .getByRole("searchbox", { name: "Search help articles" })
      .fill("borrow an item")
    await expect(
      page.getByRole("button", {
        name: "How do I borrow an item?",
        exact: true,
      })
    ).toBeVisible()
    await page
      .getByRole("button", { name: "How do I borrow an item?", exact: true })
      .click()
    await expect(
      page.getByText(/Open Borrow and search or filter/).last()
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: `/tmp/borrowlah-help-${width}.png`,
      fullPage: true,
    })
    const a11y = await new AxeBuilder({ page }).include("#main-content").analyze()
    expect(a11y.violations).toEqual([])
    await page.getByRole("button", { name: "New chat" }).click()
    await expect(page).toHaveURL(/\/help$/)
    await expect(
      page.getByRole("heading", { name: "A little help from your block." })
    ).toBeVisible()
  })
}
