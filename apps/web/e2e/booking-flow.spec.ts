import { expect, test } from "@playwright/test"

test.setTimeout(120_000)

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/")
  if (await page.getByRole("button", { name: /Aisyah · resident/ }).count()) {
    await page.getByRole("button", { name: email.startsWith("aisyah") ? "Aisyah · resident" : "Raj · organiser" }).click()
  } else {
    await page.goto("/sign-in")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill("BorrowBetter-Demo-2026!")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
  }
  await page.waitForURL("**/home")
}

test("seeded booking flow reaches completed with two-sided confirmation", async ({ browser }) => {
  const rajContext = await browser.newContext()
  const aisyahContext = await browser.newContext()
  const raj = await rajContext.newPage()
  const aisyah = await aisyahContext.newPage()

  await signIn(raj, "raj@borrowbetter.demo")
  await raj.goto("/borrow/mine")
  await raj.getByRole("tab", { name: "I'm lending" }).click()
  await raj.getByRole("link", { name: /Pressure washer for the next clean-up/ }).click()
  await raj.waitForURL("**/borrow/bookings/**")
  const bookingUrl = raj.url()
  await raj.getByRole("button", { name: "Approve request" }).click()
  await expect(raj.getByText("approved")).toBeVisible()

  await signIn(aisyah, "aisyah@borrowbetter.demo")
  await aisyah.goto(bookingUrl)
  await expect(aisyah.getByRole("button", { name: "Confirm handover" })).toBeVisible()
  await aisyah.getByRole("button", { name: "Confirm handover" }).click()
  await expect(aisyah.getByText("handed over")).toBeVisible()
  await raj.goto(bookingUrl)
  await raj.getByRole("button", { name: "Confirm handover" }).click()
  await aisyah.goto(bookingUrl)
  await aisyah.selectOption('select[name="wouldHaveBought"]', "yes")
  await aisyah.getByRole("button", { name: "Mark returned" }).click()

  await raj.goto(bookingUrl)
  await raj.getByRole("button", { name: "Confirm return" }).click()
  await expect(raj.getByText("completed")).toBeVisible()

  await aisyahContext.close()
  await rajContext.close()
})
