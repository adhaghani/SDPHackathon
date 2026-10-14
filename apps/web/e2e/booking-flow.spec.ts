import { expect, test, type Page } from "@playwright/test"

test.setTimeout(180_000)

async function joinResident(page: Page) {
  await page.goto("/sign-up")
  await page.getByLabel("Display name").fill("Workflow Resident")
  await page
    .locator("#signup-email")
    .fill(`workflow-${Date.now()}@example.test`)
  await page.getByLabel("Password").fill("Workflow-Resident-2026!")
  await page.locator('label[for="acceptedTerms"]').click()
  await page.locator('label[for="acceptedPrivacy"]').click()
  await page.getByRole("button", { name: "Create account" }).click()
  await page.waitForURL("**/onboarding")
  await page.getByLabel("Township join code").fill("HARMONI-DEMO")
  await page.getByRole("button", { name: "Check code" }).click()
  await page.locator("#neighbourhoodId").selectOption({ label: "Anggun" })
  await page.getByLabel("Unit label").fill("Workflow test")
  await page.getByRole("button", { name: "Join township" }).click()
  await page.waitForURL("**/home")
}

async function bookingAwards(page: Page, bookingId: string) {
  const response = await page.request.get("/api/profile/export")
  expect(response.ok()).toBe(true)
  const data = await response.json()
  return (
    data.points_ledger as Array<{
      source_id: string
      action_type: string
      delta: number
    }>
  ).filter((row) => row.source_id === bookingId)
}

for (const width of [390, 1440]) {
  test(`join → request → two-sided handover → return → exactly-once points at ${width}px`, async ({
    browser,
  }) => {
    const residentContext = await browser.newContext({
      viewport: { width, height: 900 },
      timezoneId: "Asia/Kuala_Lumpur",
    })
    const lenderContext = await browser.newContext({
      viewport: { width, height: 900 },
      timezoneId: "Asia/Kuala_Lumpur",
    })
    const resident = await residentContext.newPage()
    const lender = await lenderContext.newPage()
    try {
      await joinResident(resident)
      await expect(
        resident.getByRole("heading", { name: "Your next step" })
      ).toBeVisible()
      await resident.goto("/borrow")
      await resident
        .locator('a[href^="/borrow/items/"]')
        .filter({ hasText: "Pressure washer for the next clean-up" })
        .first()
        .click()
      await resident.locator("#item-borrowing-dates").click()
      // Today's one-day loan avoids the seeded future booking window.
      await resident
        .getByRole("dialog")
        .getByRole("button", { name: /^Today,/ })
        .click()
      await resident.keyboard.press("Escape")
      await resident
        .getByRole("button", { name: "Request", exact: true })
        .click()
      await expect(resident.getByText("Request sent.")).toBeVisible()
      await resident.getByRole("button", { name: "Open booking" }).click()
      await resident.waitForURL("**/borrow/bookings/**")
      const bookingUrl = resident.url()
      const bookingId = new URL(bookingUrl).pathname.split("/").at(-1)!
      expect(await bookingAwards(resident, bookingId)).toHaveLength(0)

      await lender.goto("/")
      await lender.getByRole("button", { name: "Raj · organiser" }).click()
      await lender.waitForURL("**/home")
      await expect(
        lender.getByRole("link", { name: "Review request" }).first()
      ).toBeVisible()
      await lender.goto(bookingUrl)
      await lender.getByRole("button", { name: "Approve request" }).click()
      await expect(lender.getByText("approved", { exact: true })).toBeVisible()

      await resident.goto(bookingUrl)
      const guide = resident.getByRole("checkbox", {
        name: "I've read the how-to",
      })
      if (await guide.count()) await guide.check()
      await resident
        .getByRole("button", { name: "Confirm handover", exact: true })
        .click()
      await expect(
        resident.getByText(
          "Your handover is confirmed. Waiting for the other participant."
        )
      ).toBeVisible()
      await expect(
        resident.getByText("approved", { exact: true })
      ).toBeVisible()
      expect(await bookingAwards(resident, bookingId)).toHaveLength(0)
      await lender.goto(bookingUrl)
      await lender
        .getByRole("button", { name: "Confirm handover", exact: true })
        .click()
      await expect(
        lender.getByText("With borrower", { exact: true })
      ).toBeVisible()

      await resident.goto("/home")
      await resident.getByRole("link", { name: "Arrange return" }).click()
      await resident.selectOption('select[name="wouldHaveBought"]', "yes")
      await resident
        .getByRole("button", { name: "Mark returned", exact: true })
        .click()
      await expect(resident.getByText("Booking updated.")).toBeVisible()
      await lender.goto("/home")
      await lender
        .getByRole("link", { name: "Confirm return", exact: true })
        .click()
      await lender
        .getByRole("button", { name: "Confirm return", exact: true })
        .click()
      await expect(lender.getByText("completed", { exact: true })).toBeVisible()
      const residentAwards = await bookingAwards(resident, bookingId)
      const lenderAwards = await bookingAwards(lender, bookingId)
      expect(residentAwards).toHaveLength(1)
      expect(residentAwards[0]).toMatchObject({
        action_type: "item_returned_on_time",
      })
      expect(residentAwards[0]!.delta).toBeGreaterThan(0)
      expect(lenderAwards).toHaveLength(1)
      expect(lenderAwards[0]).toMatchObject({
        action_type: "item_lent_completed",
      })
      expect(lenderAwards[0]!.delta).toBeGreaterThan(0)
      await lender.reload()
      expect(await bookingAwards(lender, bookingId)).toEqual(lenderAwards)
      await expect(
        lender.getByRole("button", { name: "Confirm return", exact: true })
      ).toHaveCount(0)
    } finally {
      await residentContext.close()
      await lenderContext.close()
    }
  })
}
