import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

test("a resident logs a recycling estimate and sees home impact updates", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Aisyah · resident" }).click()
  await page.waitForURL("**/home", { timeout: 60000 })

  await expect(page.getByRole("heading", { name: "Your recycling impact" })).toBeVisible()
  await expect(page.getByRole("progressbar", { name: /recycling goal/i })).toBeVisible()

  await page.goto("/recycling")
  await page
    .locator('section[aria-labelledby="new-estimate-heading"]')
    .getByRole("button", { name: "Log recycling" })
    .click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: "New recycling estimate" })).toBeVisible()
  await expect(dialog.getByLabel("Photos (optional)")).toBeVisible()
  await expect(dialog.locator('input[type="date"]')).toHaveCount(0)

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  )
  await dialog.getByLabel("Photos (optional)").setInputFiles({
    name: "recycling.png",
    mimeType: "image/png",
    buffer: png,
  })
  await expect(dialog.getByRole("img", { name: "Recycling photo 1" })).toBeVisible()

  const addButton = page.getByRole("button", { name: "Add one 500ml bottle" })
  await addButton.focus()
  await page.keyboard.press("Enter")
  const quantity = page.getByLabel("500ml bottle quantity")
  await expect(quantity).toHaveValue("1")

  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await expect(quantity).toHaveValue("10")
  await expect(page.getByText("0.2 kg", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Save estimate" }).click()
  await expect(page.getByText("Estimate saved. Your impact totals are updated.")).toBeVisible()
  await dialog.getByRole("button", { name: "Cancel" }).click()

  await page.goto("/home")
  await expect(page.getByRole("heading", { name: "Your recycling impact" })).toBeVisible()
  await expect(page.getByText(/0\.2 kg/).first()).toBeVisible()
  await expect(page.getByRole("progressbar", { name: /recycling goal/i })).toBeVisible()
  await page.goto("/recycling")
  await expect(page.getByRole("img", { name: "Recycling photo 1" })).toBeVisible()
})

test("recycling screens respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.getByRole("button", { name: "Aisyah · resident" }).click()
  await page.waitForURL("**/home", { timeout: 60000 })
  await page.goto("/recycling")
  await expect(page.getByRole("heading", { name: "Recycling log" })).toBeVisible()
  await expect(page.getByRole("progressbar", { name: /recycling goal/i })).toBeVisible()
})
