import { expect, test } from "@playwright/test"

test("a resident can create an account and sign in again", async ({ page }) => {
  const email = `phase0-${Date.now()}@example.test`
  const password = `Test-${Date.now()}A1`

  await page.goto("/sign-up")
  await page.getByLabel("Display name").fill("Phase Zero")
  await page.locator("#signup-email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.locator('label[for="acceptedTerms"]').click()
  await page.locator('label[for="acceptedPrivacy"]').click()
  await page.getByRole("button", { name: "Create account" }).click()

  await page.waitForURL("**/onboarding")
  await expect(
    page.getByRole("heading", { name: "Join your township" })
  ).toBeVisible()

  await page.getByRole("button", { name: "Sign out" }).click()
  await page.waitForURL("**/sign-in")

  await page.locator("#email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()

  await page.waitForURL("**/home")
  await expect(
    page.getByRole("heading", { name: "Home is ready" })
  ).toBeVisible()
})
