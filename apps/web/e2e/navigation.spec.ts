import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

test("mobile navigation exposes the five primary tabs and full route drawer", async ({ browser }) => {
  const residentContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const resident = await residentContext.newPage()
  await resident.goto("/")
  await resident.getByRole("button", { name: "Aisyah · resident" }).click()
  await resident.waitForURL("**/home")

  const primaryTabs = resident.locator('nav[aria-label="Primary"]:visible a')
  await expect(primaryTabs).toHaveCount(5)
  await expect(primaryTabs).toHaveText(["Block", "Borrow", "Recycle", "Events", "Impact"])

  const toggle = resident.getByRole("button", { name: "Open navigation" })
  await expect(toggle).toBeVisible()
  await toggle.click()

  const drawer = resident.getByRole("dialog", { name: "Navigation" })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole("link", { name: "Notifications", exact: true })).toBeVisible()
  await expect(drawer.getByRole("link", { name: "Your loans", exact: true })).toBeVisible()
  await expect(drawer.locator('a[href="/profile"]').last()).toBeVisible()
  await expect(drawer.getByRole("link", { name: "Settings", exact: true })).toBeVisible()
  await expect(drawer.getByRole("link", { name: "Giveaway", exact: true })).toBeVisible()
  await drawer.getByRole("link", { name: "Recycle", exact: true }).click()
  await resident.waitForURL("**/recycling")
  await expect(drawer).toHaveCount(0)

  await residentContext.close()
})

test("admin drawer exposes engagement and AI planning routes", async ({ browser }) => {
  const adminContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const admin = await adminContext.newPage()
  await admin.goto("/")
  await admin.getByRole("button", { name: "Township office · admin" }).click()
  await admin.waitForURL("**/admin")
  await admin.getByRole("button", { name: "Open navigation" }).click()
  const drawer = admin.getByRole("dialog", { name: "Navigation" })
  await expect(drawer.getByRole("link", { name: "Engagement" })).toBeVisible()
  await expect(drawer.getByRole("link", { name: "AI summary" })).toBeVisible()
  await expect(drawer.getByRole("link", { name: "Methodology" })).toBeVisible()
  await adminContext.close()
})
