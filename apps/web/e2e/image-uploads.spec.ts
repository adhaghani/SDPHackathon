import { expect, test, type Page } from "@playwright/test"

const photo = new URL("./fixtures/upload-check.png", import.meta.url).pathname

test.setTimeout(120_000)
test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 })

async function login(page: Page, role = "Aisyah · resident") {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: role, exact: true }).click()
  await page.waitForURL(/\/(home|events|sponsor\/portal)$/)
}

async function loaded(page: Page, src: string) {
  const img = page
    .locator("img")
    .filter({ visible: true })
    .and(page.locator(`img[src="${src}"]`))
    .first()
  await img.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)
    )
    .toBe(true)
}

async function upload(
  page: Page,
  input: string,
  hidden: string,
  prefix: string,
  file = photo
) {
  // A server-rendered file input can appear before React attaches its change handler.
  await page.waitForFunction((selector) => {
    const element = document.querySelector(selector)
    return (
      element &&
      Object.keys(element).some((key) => key.startsWith("__reactProps$"))
    )
  }, input)
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().includes(`/storage/v1/object/item-photos/${prefix}/`),
    { timeout: 20_000 }
  )
  await page.locator(input).setInputFiles(file)
  if (prefix !== "recycling") {
    const cropButton = page.getByRole("button", { name: "Use this crop" })
    await expect(cropButton).toBeVisible()
    await cropButton.click()
  }
  expect((await response).ok()).toBe(true)
  const value = page.locator(`input[name="${hidden}"]`).first()
  await expect(value).toHaveValue(new RegExp(`/item-photos/${prefix}/`))
  const url = await value.inputValue()
  expect((await page.request.get(url)).ok()).toBe(true)
  return url
}

test("borrow photo and guide photos upload, persist and display", async ({
  page,
}) => {
  await login(page)
  await page.goto("/borrow/new")
  const src = await upload(page, "#item-photo", "photoPath", "items")
  await expect(
    page.getByRole("button", { name: "List item", exact: true })
  ).toBeEnabled({ timeout: 90_000 })
  const title = `Image verification ${Date.now()}`
  await page.locator("#item-title").fill(title)
  await page.locator("#item-category").selectOption({ index: 1 })
  await page.getByRole("button", { name: "List item", exact: true }).click()
  await expect(page.getByText("Item listed.", { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "View item" }).click()
  await page.waitForURL(/\/borrow\/items\//)
  await loaded(page, src)
  await page.getByRole("button", { name: "Add how-to guide" }).click()
  await page
    .locator("#guide-body")
    .fill("Place on level ground and follow the safety instructions.")
  const guide = await upload(page, "#guide-photos", "photoPaths", "guides")
  await loaded(page, guide)
  await page.getByRole("button", { name: "Save how-to guide" }).click()
  await expect(page.getByText(/Guide saved|Guide updated/)).toBeVisible()
  await page.reload()
  await loaded(page, src)
  await page.getByRole("button", { name: "Edit how-to guide" }).click()
  await loaded(page, guide)
  await page
    .getByRole("img", { name: /Guide photo 1/i })
    .scrollIntoViewIfNeeded()
  await page.screenshot({ path: "test-results/image-guide-desktop.png" })
  await page.setViewportSize({ width: 390, height: 844 })
  await loaded(page, guide)
  await page.screenshot({ path: "test-results/image-guide-mobile.png" })
  await page.goto("/borrow")
  await loaded(page, src)
})

test("event cover uploads and displays after saving", async ({ page }) => {
  await login(page, "Raj · organiser")
  await page.goto("/events/new")
  const src = await upload(
    page,
    "#event-cover",
    "coverPath",
    "events",
    new URL("./fixtures/upload-check.jpg", import.meta.url).pathname
  )
  await page.locator("#title").fill(`Image verification event ${Date.now()}`)
  await page.locator("#categorySlug").selectOption({ index: 1 })
  for (const id of ["startsAt", "endsAt"]) {
    await page.locator(`#${id}`).click()
    const calendar = page.locator('[data-slot="popover-content"][data-open]')
    await calendar.getByRole("button", { name: /Next month/i }).click()
    await calendar
      .locator("button[data-day]")
      .filter({ hasText: /^15$/ })
      .first()
      .click()
    await page.keyboard.press("Escape")
  }
  await page.getByLabel("Starts time", { exact: true }).fill("09:00")
  await page.getByLabel("Ends time", { exact: true }).fill("10:00")
  await page.locator("#locationText").fill("Community hall")
  await page.getByRole("button", { name: "Create event", exact: true }).click()
  await page
    .getByRole("button", { name: "Open event" })
    .click({ timeout: 60_000 })
  await page.waitForURL(/\/events\//)
  await loaded(page, src)
  await page.reload()
  await loaded(page, src)
  await page.goto("/events")
  await loaded(page, src)
})

test("giveaway photo uploads, persists and displays", async ({ page }) => {
  await login(page)
  await page.goto("/giveaway/new")
  const src = await upload(page, "#giveaway-photo", "photoPath", "giveaways")
  let release!: () => void
  let started!: () => void
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve
  })
  const releaseRequest = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(
    "**/storage/v1/object/item-photos/giveaways/*",
    async (route) => {
      started()
      await releaseRequest
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Upload rejected" }),
      })
    }
  )
  await expect(page.locator("#giveaway-photo")).toBeEnabled({ timeout: 90_000 })
  await page.locator("#giveaway-photo").setInputFiles([])
  await page.locator("#giveaway-photo").setInputFiles(photo)
  await page.getByRole("button", { name: "Use this crop" }).click()
  await requestStarted
  await expect(
    page.getByRole("button", { name: "Use this crop" })
  ).toBeDisabled()
  release()
  await expect(page.getByText(/Photo upload failed/)).toBeVisible()
  await expect(page.locator('input[name="photoPath"]')).toHaveValue(src)
  await page.unroute("**/storage/v1/object/item-photos/giveaways/*")
  await page
    .locator("#giveaway-title")
    .fill(`Image verification giveaway ${Date.now()}`)
  await page.getByRole("button", { name: "Publish giveaway" }).click()
  await page.getByRole("button", { name: "Browse giveaways" }).click()
  await page.waitForURL("**/giveaway")
  await loaded(page, src)
  await page.reload()
  await loaded(page, src)
})

test("sponsor reward image uploads, persists and displays", async ({
  page,
}) => {
  await login(page, "Kopi Kita · partner")
  await page.goto("/sponsor/portal")
  const src = await upload(
    page,
    "#sponsor-reward-image",
    "imagePath",
    "sponsors",
    new URL("./fixtures/upload-check.webp", import.meta.url).pathname
  )
  await page
    .locator("#sponsor-reward-title")
    .fill(`Image verification reward ${Date.now()}`)
  await page.locator("#sponsor-reward-cost").fill("10")
  await page.getByRole("button", { name: "Create reward", exact: true }).click()
  await expect(page.getByText(/Reward created/i)).toBeVisible()
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page
    .getByRole("button", { name: "Aisyah · resident", exact: true })
    .click()
  await page.waitForURL("**/home")
  await page.goto("/rewards")
  await loaded(page, src)
  await page.reload()
  await loaded(page, src)
  await page.screenshot({ path: "test-results/image-reward-desktop.png" })
  await page.setViewportSize({ width: 390, height: 844 })
  await loaded(page, src)
  await page.screenshot({ path: "test-results/image-reward-mobile.png" })
})

test("recycling photos upload, persist and display", async ({ page }) => {
  await login(page)
  await page.goto("/recycling")
  await page
    .locator('section[aria-labelledby="new-estimate-heading"]')
    .getByRole("button", { name: "Log recycling" })
    .click()
  const src = await upload(page, "#recycling-photos", "photoPaths", "recycling")
  await page.getByRole("button", { name: "Add one 500ml bottle" }).click()
  await page.getByRole("button", { name: "Save estimate" }).click()
  await expect(
    page.getByText("Estimate saved. Your impact totals are updated.")
  ).toBeVisible()
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click()
  await page.reload()
  const image = page
    .getByRole("img", { name: "Recycling photo 1" })
    .filter({ visible: true })
    .first()
  await expect(image).toBeVisible()
  expect(
    await image.evaluate((element) => getComputedStyle(element).backgroundImage)
  ).toContain(src)
  expect(
    await page.evaluate(async (url) => {
      const image = new Image()
      image.src = url
      await image.decode()
      return image.naturalWidth > 0
    }, src)
  ).toBe(true)
})
