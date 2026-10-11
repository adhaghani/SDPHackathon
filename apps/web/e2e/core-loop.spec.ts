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
  await expect(aisyah.getByRole("heading", { name: /Home,/ })).toBeVisible()

  await aisyah.goto("/events")
  const eventLink = aisyah.getByRole("link", { name: /Demo check-in window/ }).first()
  await eventLink.click()
  await aisyah.getByRole("button", { name: "RSVP as attendee" }).click()
  await expect(aisyah.getByText("You are going")).toBeVisible()
  const eventUrl = new URL(aisyah.url())
  const tokenResponse = await aisyah.request.get(`${eventUrl.origin}/api/events/${eventUrl.pathname.split("/")[2]}/ticket`)
  const token = (await tokenResponse.json()).token as string
  expect(token).toBeTruthy()

  await raj.goto("/")
  await raj.getByRole("button", { name: "Raj · organiser" }).click()
  await raj.waitForURL("**/home")
  await raj.goto(`${eventUrl.pathname}/manage`)
  await raj.locator("#qr-token").fill(token)
  await raj.getByRole("button", { name: "Check token" }).click()
  await expect(raj.getByText(/Aisyah Rahman checked in/)).toBeVisible()

  await aisyah.goto("/borrow")
  await expect(aisyah.getByRole("heading", { name: "Borrow from your neighbours" })).toBeVisible()
  await aisyah.goto("/rewards")
  await expect(aisyah.getByText(/Voucher|BP available/)).toBeVisible()

  await aisyahContext.close()
  await rajContext.close()
})
