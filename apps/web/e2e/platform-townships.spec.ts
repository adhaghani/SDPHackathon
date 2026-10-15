import { randomBytes } from "node:crypto"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { loadDemoEnv, requiredEnv } from "../../../scripts/env"

test.setTimeout(180_000)
test.use({ actionTimeout: 20_000 })
const tag = randomBytes(5).toString("hex")
const ownerEmail = `platform-${tag}@borrowlah.demo`
const managerEmail = `manager-${tag}@borrowlah.demo`
const password = `Platform-${randomBytes(16).toString("hex")}!`
const slug = `platform-ui-${tag}`
let admin: SupabaseClient
let ownerId: string

test.beforeAll(async () => {
  loadDemoEnv()
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
    throw new Error(
      "Platform browser tests only provision fixtures on local Supabase."
    )
  admin = createClient(url, requiredEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
  })
  if (error || !data.user)
    throw new Error("Could not create local platform fixture.")
  ownerId = data.user.id
  execFileSync(
    "node",
    ["--import", "tsx", "scripts/bootstrap-superadmin.ts", ownerEmail],
    { cwd: path.resolve(process.cwd(), "../.."), stdio: "pipe" }
  )
})

test.afterAll(async () => {
  if (!admin) return
  const { data: towns } = await admin
    .from("townships")
    .select("id")
    .eq("slug", slug)
  for (const town of towns ?? []) {
    for (const table of [
      "platform_audit_log",
      "platform_manager_invitations",
      "township_members",
    ])
      await admin.from(table).delete().eq("township_id", town.id)
    await admin.from("townships").delete().eq("id", town.id)
  }
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  for (const user of data?.users ?? [])
    if (user.id === ownerId || user.email === managerEmail)
      await admin.auth.admin.deleteUser(user.id)
})

test("superadmin draws, provisions, appoints and activates a township", async ({
  page,
  browser,
}, testInfo) => {
  await page.goto("/superadmin")
  await expect(page).toHaveURL(/sign-in/)
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(ownerEmail)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Townships, connected." })
  ).toBeVisible()
  await page.getByRole("link", { name: "Create township" }).click()
  await page
    .getByLabel("Township name", { exact: true })
    .fill("Platform UI Town")
  await page.getByLabel("URL slug", { exact: true }).fill(slug)
  await page.getByLabel("State / federal territory").fill("Selangor")
  await page.getByLabel("District", { exact: true }).fill("Petaling")
  await page.getByLabel("Resident join code").fill(`UI-${tag.toUpperCase()}`)
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByRole("button", { name: "Draw polygon", exact: true }).click()
  const map = page.locator(".leaflet-container")
  await expect(map.locator(".leaflet-mouse-marker")).toBeAttached()
  for (const [index, [x, y]] of [
    [150, 160],
    [290, 160],
    [290, 280],
    [150, 280],
  ].entries()) {
    await map.click({ position: { x: x!, y: y! }, delay: 100 })
    await expect(
      map.locator(".leaflet-marker-icon:not(.leaflet-mouse-marker)")
    ).toHaveCount(index + 1)
  }
  await page.getByRole("button", { name: "Undo last point" }).click()
  await expect(
    map.locator(".leaflet-marker-icon:not(.leaflet-mouse-marker)")
  ).toHaveCount(3)
  await map.click({ position: { x: 150, y: 280 }, delay: 100 })
  await expect(
    map.locator(".leaflet-marker-icon:not(.leaflet-mouse-marker)")
  ).toHaveCount(4)
  await map
    .locator(".leaflet-marker-icon:not(.leaflet-mouse-marker)")
    .first()
    .click({ force: true })
  await expect(page.getByText(/Boundary ready/)).toBeVisible()
  const overlap = page.getByLabel("I reviewed and accept this overlap.")
  if (await overlap.isVisible()) await overlap.check()
  await page.screenshot({
    path: testInfo.outputPath("boundary-desktop.png"),
    fullPage: true,
  })
  const desktopAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(desktopAxe.violations).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath("boundary-mobile.png"),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  const mobileAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(mobileAxe.violations).toEqual([])
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page
    .getByLabel("Neighbourhood names")
    .fill("North Precinct\nSouth Precinct")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByLabel("Manager’s full name").fill("UI Township Manager")
  await page.getByLabel("Manager’s email address").fill(managerEmail)
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page
    .getByRole("button", {
      name: "Create township and appoint manager",
      exact: true,
    })
    .click()
  await expect(page).toHaveURL(/\/superadmin\/townships\/[0-9a-f-]+\?saved=1/)
  await expect(
    page.getByText("Invitation sent · awaiting acceptance", { exact: true })
  ).toBeVisible()
  const detailUrl = page.url()

  const inbox = await fetch("http://127.0.0.1:54324/api/v1/messages").then(
    (r) => r.json()
  )
  const message = inbox.messages.find((m: { To: { Address: string }[] }) =>
    m.To.some((to) => to.Address === managerEmail)
  )
  expect(message).toBeTruthy()
  const email = await fetch(
    `http://127.0.0.1:54324/api/v1/message/${message.ID}`
  ).then((r) => r.json())
  const link = String(email.Text || email.HTML)
    .match(/https?:\/\/[^\s"<>]+\/auth\/v1\/verify\?[^\s"<>]+/)?.[0]
    ?.replaceAll("&amp;", "&")
  expect(link).toBeTruthy()
  const managerContext = await browser.newContext()
  const managerPage = await managerContext.newPage()
  await managerPage.goto(link!)
  await expect(
    managerPage.getByRole("button", { name: "Accept manager appointment" })
  ).toBeVisible()
  await managerPage.getByLabel("Password", { exact: true }).fill(password)
  await managerPage
    .getByLabel("Confirm password", { exact: true })
    .fill(password)
  await managerPage.getByRole("checkbox").check()
  await managerPage
    .getByRole("button", { name: "Accept manager appointment" })
    .click()
  await expect(
    managerPage.getByRole("heading", {
      name: "Your township is being prepared",
    })
  ).toBeVisible()

  await page.goto(detailUrl)
  await expect(page.getByText("Active manager", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(page.getByText(/Boundary ready/)).toBeVisible()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Set up the community" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Review your township" })
  ).toBeVisible()
  await page
    .getByLabel("Township status", { exact: true })
    .selectOption("active")
  await page.getByRole("button", { name: "Save township", exact: true }).click()
  await expect(page.getByText("active", { exact: true }).first()).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("township-detail.png"),
    fullPage: true,
  })
  await managerPage.goto("/admin")
  await expect(managerPage).toHaveURL(/\/admin$/)
  await managerPage.goto("/superadmin")
  await expect(managerPage).toHaveURL(/\/home$/)
  await page.goto("/superadmin")
  await page.getByLabel("Search townships").fill("Platform UI Town")
  await expect(
    page.locator(`a[href="${new URL(detailUrl).pathname}"]`)
  ).toBeVisible()
  await expect(page.locator(".leaflet-container")).toBeVisible()
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("directory-desktop.png"),
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath("directory-mobile.png"),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(detailUrl)
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(page.getByText(/Boundary ready/)).toBeVisible()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Set up the community" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Review your township" })
  ).toBeVisible()
  await page
    .getByLabel("Township status", { exact: true })
    .selectOption("archived")
  await page
    .getByRole("button", { name: "Archive township", exact: true })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Archive township", exact: true })
    .click()
  await expect(
    page.getByText("archived", { exact: true }).first()
  ).toBeVisible()
  await managerPage.goto("/admin")
  await expect(
    managerPage.getByRole("heading", { name: "Your township is archived" })
  ).toBeVisible()
  await managerContext.close()
})
