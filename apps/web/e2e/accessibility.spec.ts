import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function expectNoViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations).toEqual([])
}

test("landing and resident home have no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/")
  await expectNoViolations(page)

  await page.getByRole("button", { name: "Aisyah · resident" }).click()
  await page.waitForURL("**/home")
  await expectNoViolations(page)
})

test("admin Township Pulse has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Township office · admin" }).click()
  await page.waitForURL("**/admin")
  await expectNoViolations(page)
})
