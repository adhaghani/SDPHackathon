import { expect, test } from "@playwright/test"

test.setTimeout(120_000)
for (const width of [390, 1440]) {
  test(`office follows demand, equipment outcomes and costs at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    try {
      await page.goto("/")
      await page.getByRole("button", { name: "Township office · admin" }).click()
      await page.waitForURL("**/admin")
      await page.goto("/admin/demand")
      await expect(page.getByRole("heading", { name: "Demand intelligence", exact: true })).toBeVisible()
      await expect(page.getByRole("table")).toBeVisible()
      await expect(page.getByRole("columnheader", { name: "Distinct residents", exact: true })).toBeVisible()
      await expect(page.getByRole("columnheader", { name: "Completed loans", exact: true })).toBeVisible()
      await expect(page.getByText(/Programme costs this calendar month/)).toBeVisible()
      await page.getByRole("link", { name: "Review costs", exact: true }).click()
      await expect(page).toHaveURL(/\/admin\/budget$/)
      expect(await page.locator("h1").textContent()).toBeTruthy()
    } finally { await context.close() }
  })
}
