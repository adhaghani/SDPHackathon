import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

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
  await page.waitForURL("**/home", { timeout: 60000 })
  await expectNoViolations(page)
})

test("guest pass, public pass and guard screens have no WCAG A/AA violations", async ({ browser }) => {
  const residentContext = await browser.newContext()
  const resident = await residentContext.newPage()
  await resident.goto("/")
  await resident.getByRole("button", { name: "Aisyah · resident" }).click()
  await resident.waitForURL("**/home")
  await resident.goto("/guests")
  await expectNoViolations(resident)
  await resident.goto("/pass/sample-guest-token-128bit")
  await expectNoViolations(resident)
  await residentContext.close()

  const guardContext = await browser.newContext()
  const guard = await guardContext.newPage()
  await guard.goto("/")
  await guard.getByRole("button", { name: "Gate Guard" }).click()
  await guard.waitForURL("**/guard")
  await expectNoViolations(guard)
  await guardContext.close()
})

test("admin Township Pulse has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Township office · admin" }).click()
  await page.waitForURL("**/admin")
  await expectNoViolations(page)
})
