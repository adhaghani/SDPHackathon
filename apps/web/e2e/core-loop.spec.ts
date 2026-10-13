import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

test("seeded demo loop verifies check-in, borrow discovery and rewards", async ({ browser }) => {
  const aisyahContext = await browser.newContext()
  const rajContext = await browser.newContext()
  const aisyah = await aisyahContext.newPage()
  const raj = await rajContext.newPage()

  await aisyah.goto("/")
  await aisyah.getByRole("button", { name: "Aisyah · resident" }).click()
  await aisyah.waitForURL("**/home")
  await expect(aisyah.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 })

  await aisyah.goto("/events")
  const eventLink = aisyah
    .locator('a[href^="/events/"]')
    .filter({ hasText: "Demo check-in window" })
    .first()
  const eventHref = await eventLink.getAttribute("href")
  if (eventHref) await aisyah.goto(eventHref)
  const registerButton = aisyah.getByRole("button", { name: "Register to attend" })
  if (await registerButton.count()) await registerButton.click()
  await expect(aisyah.getByText(/You are going|Checked in/).first()).toBeVisible()
  const eventUrl = new URL(aisyah.url())
  const tokenResponse = await aisyah.request.get(`${eventUrl.origin}/api/events/${eventUrl.pathname.split("/")[2]}/ticket`)
  const token = (await tokenResponse.json()).token as string
  expect(token).toBeTruthy()

  await raj.goto("/")
  await raj.getByRole("button", { name: "Raj · organiser" }).click()
  await raj.waitForURL("**/home")
  await raj.goto(`${eventUrl.pathname}/manage`)
  await raj.locator("#qr-token").fill(token)
  await raj.getByRole("button", { name: "Check token" }).evaluate((element) =>
    (element as HTMLButtonElement).click()
  )
  await expect(raj.getByText(/Aisyah Rahman (?:is already )?checked in/)).toBeVisible()

  await aisyah.goto("/borrow")
  await expect(aisyah.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 })
  await aisyah.goto("/rewards")
  await expect(aisyah.getByText(/Voucher|BP available/)).toBeVisible()

  if (process.env.NEXT_PUBLIC_ENABLE_ROTATING_QR === "true") {
    await aisyah.goto(eventUrl.pathname + "/ticket")
    await expect(aisyah.getByText(/refreshes in 60s/)).toBeVisible()
  }

  await aisyahContext.close()
  await rajContext.close()
})
