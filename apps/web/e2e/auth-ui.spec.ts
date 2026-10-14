import { expect, test } from "@playwright/test"

test("password visibility keeps the entered value", async ({ page }) => {
  for (const route of ["/sign-in", "/sign-up"]) {
    await page.goto(route)
    const password = page.getByLabel("Password", { exact: true })
    await password.fill("TestPassword123")
    await page.getByRole("button", { name: "Show password" }).click()
    await expect(password).toHaveAttribute("type", "text")
    await expect(password).toHaveValue("TestPassword123")
    await page.getByRole("button", { name: "Hide password" }).click()
    await expect(password).toHaveAttribute("type", "password")
    await expect(password).toHaveValue("TestPassword123")
  }
})

test("sign-in link disclosure retains the email address", async ({ page }) => {
  await page.goto("/sign-in")
  await expect(page.locator("#magic-email")).toBeHidden()
  await page.locator("#email").fill("resident@example.test")
  await page.getByText("Sign in without a password", { exact: true }).focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#magic-email")).toBeVisible()
  await expect(page.locator("#magic-email")).toHaveValue(
    "resident@example.test"
  )
  await page.locator("#magic-email").fill("other@example.test")
  await expect(page.locator("#email")).toHaveValue("other@example.test")
})

test("consent errors are associated with their controls", async ({ page }) => {
  await page.goto("/sign-up")
  await expect(page.locator("#signup-password-hint")).toBeVisible()
  await expect(page.getByRole("alert")).toHaveCount(0)
  await page.getByLabel("Display name").fill("Auth UI Check")
  await page.locator("#signup-email").fill("auth-ui@example.test")
  await page.getByLabel("Password", { exact: true }).fill("TestPassword123")
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click()
  await expect(page.locator("#terms-error")).toHaveText(
    "Accept the terms to continue."
  )
  await expect(
    page.getByRole("checkbox", {
      name: "I agree to the community guidelines and terms.",
    })
  ).toHaveAttribute("aria-describedby", "terms-error")
  await expect(
    page.getByRole("checkbox", {
      name: "I understand how BorrowLah uses my data.",
    })
  ).toHaveAttribute("aria-invalid", "true")
})
