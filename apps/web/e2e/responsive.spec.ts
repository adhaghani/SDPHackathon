import { expect, test } from "@playwright/test"

test.setTimeout(600_000)

const viewports = [
  { width: 320, height: 760 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]

async function signInAs(page: import("@playwright/test").Page, role: string) {
  await page.goto("/")
  await page.getByRole("button", { name: role }).click()
  await page.waitForURL(/\/(home|admin)/)
}

test("new Feature Pack screens do not scroll horizontally at target widths", async ({ browser }) => {
  const residentContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const resident = await residentContext.newPage()
  const admin = await adminContext.newPage()

  await signInAs(resident, "Aisyah · resident")
  await signInAs(admin, "Township office · admin")

  const residentRoutes = [
    "/home",
    "/borrow",
    "/borrow/requests",
    "/help",
    "/profile",
    "/profile/settings",
    "/rewards",
  ]
  const adminRoutes = ["/admin", "/admin/demand", "/admin/engagement", "/admin/methodology"]

  for (const viewport of viewports) {
    await resident.setViewportSize(viewport)
    await admin.setViewportSize(viewport)
    for (const route of residentRoutes) {
      await resident.goto(route)
      await expect(resident.locator("body")).toBeVisible()
      const overflow = await resident.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(
        overflow.clientWidth + 1
      )
    }
    for (const route of adminRoutes) {
      await admin.goto(route)
      await expect(admin.locator("body")).toBeVisible()
      const overflow = await admin.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(
        overflow.clientWidth + 1
      )
    }
  }

  await residentContext.close()
  await adminContext.close()
})
