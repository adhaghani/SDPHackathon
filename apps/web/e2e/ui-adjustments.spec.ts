import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

async function signIn(page: import("@playwright/test").Page, role: string) {
  await page.goto("/")
  await page.getByRole("button", { name: role }).click()
  await page.waitForURL(/\/(home|admin)/)
}

for (const width of [320, 390, 768, 1440]) {
  test(`resident UI actions and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await signIn(page, "Aisyah · resident")
    await page.goto("/rewards")
    await expect(
      page.getByRole("heading", { name: "My vouchers", exact: true })
    ).toBeVisible()
    const voucher = page.getByRole("button", { name: "Show voucher" }).first()
    await expect(voucher).toBeVisible()
    await voucher.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("dialog").locator("code")).not.toBeEmpty()
    await page.getByRole("button", { name: "Close", exact: true }).click()
    await expect(voucher).toBeFocused()
    await page.screenshot({
      path: `/tmp/ui-rewards-${width}.png`,
      fullPage: true,
    })

    await page.goto("/notifications")
    await expect(
      page.getByRole("heading", { name: "Notifications" })
    ).toBeVisible()
    await page.getByRole("button", { name: /Unread \(/ }).click()
    await expect(page).toHaveURL(/unread=1/)
    await expect(
      page.getByRole("button", { name: /Unread \(/ })
    ).toHaveAttribute("aria-current", "page")
    const list = page.locator("ul.bb-card")
    if (await list.count()) {
      expect(
        await list.evaluate((element) => getComputedStyle(element).overflow)
      ).toBe("hidden")
      const shadow = await list.evaluate(
        (element) => getComputedStyle(element).boxShadow
      )
      await list.hover()
      await page.waitForTimeout(200)
      expect(
        await list.evaluate((element) => getComputedStyle(element).boxShadow)
      ).toBe(shadow)
    }
    await page.screenshot({
      path: `/tmp/ui-notifications-${width}.png`,
      fullPage: true,
    })

    await page.goto("/events")
    const event = page
      .locator('a[href^="/events/"]')
      .filter({ has: page.locator("img") })
      .first()
    await expect(event).toBeVisible()
    const href = await event.getAttribute("href")
    await page.goto(href!)
    await expect(
      page.getByRole("heading", { name: "Event details" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Volunteer", exact: true })
    ).toBeVisible()
    if (width === 1440) {
      await page.getByRole("button", { name: "Register to attend" }).click()
      await expect(
        page.getByRole("button", { name: "Open ticket", exact: true })
      ).toBeVisible()
      await page
        .getByRole("button", { name: "Cancel registration", exact: true })
        .click()
      await expect(
        page.getByRole("dialog", { name: "Cancel your registration?" })
      ).toBeVisible()
      await page.getByRole("button", { name: "Confirm cancellation" }).click()
      await expect(
        page.getByRole("button", { name: "Register to attend" })
      ).toBeVisible()
    }
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: "Add to calendar" }).click()
    expect((await download).suggestedFilename()).toBe("borrowlah-event.ics")
    await page
      .getByRole("button", { name: "Report this event", exact: true })
      .click()
    await expect(
      page.getByRole("dialog", { name: "Report this event" })
    ).toBeVisible()
    await expect(page.getByLabel("Reason", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Submit report" })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await page.screenshot({
      path: `/tmp/ui-event-${width}.png`,
      fullPage: true,
    })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1)
    if (width >= 768) {
      const signOut = page
        .locator("aside")
        .getByRole("button", { name: "Sign out", exact: true })
      await expect(signOut).toHaveText("Sign out")
      await signOut.click()
      await expect(
        page.getByRole("alertdialog", { name: "Sign out?" })
      ).toBeVisible()
      await page.getByRole("button", { name: "Stay signed in" }).click()
    } else {
      await expect(
        page.getByRole("navigation", { name: "Primary", exact: true })
      ).toBeVisible()
    }
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
    expect(accessibility.violations).toEqual([])
  })
}

test("compact demand layout and wishlist dialog", async ({ page }) => {
  await signIn(page, "Township office · admin")
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/admin/demand")
    await expect(
      page.getByRole("heading", { name: "Demand intelligence" })
    ).toBeVisible()
    await page.screenshot({
      path: `/tmp/ui-demand-${width}.png`,
      fullPage: true,
    })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1)
  }
  const add = page
    .getByRole("button", { name: "Add to wishlist", exact: true })
    .first()
  await expect(add).toBeVisible()
  await add.click()
  await expect(
    page.getByRole("dialog", { name: "Add to shared library wishlist" })
  ).toBeVisible()
  await expect(page.getByLabel("Shared library label")).not.toBeEmpty()
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(accessibility.violations).toEqual([])
})
