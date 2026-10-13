import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

test("resident, public visitor and guard guest-pass flow", async ({ browser }) => {
  const residentContext = await browser.newContext()
  const guardContext = await browser.newContext()
  const resident = await residentContext.newPage()
  const guard = await guardContext.newPage()

  await resident.goto("/")
  await resident.getByRole("button", { name: "Aisyah · resident" }).click()
  await resident.waitForURL("**/home")
  await resident.goto("/guests")
  await expect(resident.getByRole("heading", { name: "Guest passes", exact: true })).toBeVisible()

  await resident.getByRole("button", { name: "New guest pass" }).first().click()
  await expect(resident.getByRole("dialog")).toBeVisible()
  await expect(resident.getByLabel("Visitor name")).toBeVisible()
  await expect(resident.getByLabel("Visit date")).toBeVisible()
  await resident.getByRole("dialog").getByRole("button", { name: "Close" }).click()

  await resident.goto("/pass/sample-guest-token-128bit")
  await expect(resident.getByRole("heading", { name: "Sample Visitor" })).toBeVisible()
  await expect(resident.locator("svg").first()).toBeVisible()
  await expect(resident.getByText(/Unit|unit_label/i)).toHaveCount(0)

  await guard.goto("/")
  await guard.getByRole("button", { name: "Gate Guard" }).click()
  await guard.waitForURL("**/guard")
  await expect(guard.getByRole("heading", { name: "Scan a guest pass" })).toBeVisible()
  await guard.locator("#manual-code").fill("sample-guest-token-128bit")
  await guard.getByRole("button", { name: "Validate" }).click()
  await expect(guard.getByRole("button", { name: "Check in" })).toBeVisible({ timeout: 15000 })
  await guard.getByRole("button", { name: "Check in" }).click()
  await expect(guard.getByText("Sample Visitor").last()).toBeVisible({ timeout: 15000 })

  await residentContext.close()
  await guardContext.close()
})
