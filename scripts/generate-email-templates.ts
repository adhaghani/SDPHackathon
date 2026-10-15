import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { emailTemplates, previewEmail, renderEmail } from "../emails/borrowlah"

const check = process.argv.includes("--check")
const preview = process.argv.includes("--preview")
const exportConfig = process.argv.includes("--export")
const directory = resolve("supabase/templates")
if (!check) mkdirSync(directory, { recursive: true })
let stale = false
for (const template of emailTemplates) {
  const file = resolve(directory, `${template.key}.html`)
  const html = renderEmail(template)
  if (check) {
    let current = ""
    try {
      current = readFileSync(file, "utf8")
    } catch {
      /* Report missing output below. */
    }
    if (current !== html) {
      stale = true
      console.error(`Rebuild email template: ${template.key}`)
    }
  } else writeFileSync(file, html)
}
if (stale) process.exitCode = 1
else
  console.log(
    `${emailTemplates.length} BorrowLah email templates ${check ? "are current" : "generated"}.`
  )

if (preview) {
  const output = resolve("test-results/email-previews")
  mkdirSync(output, { recursive: true })
  const links: string[] = []
  for (const template of emailTemplates) {
    const file = `${template.key}.html`
    writeFileSync(resolve(output, file), previewEmail(renderEmail(template)))
    links.push(`<li><a href="${file}">${template.subject}</a></li>`)
  }
  writeFileSync(
    resolve(output, "manager-invitation.html"),
    previewEmail(
      renderEmail(emailTemplates.find((t) => t.key === "magic_link")!),
      true
    )
  )
  links.unshift(
    '<li><a href="manager-invitation.html">Township manager invitation</a></li>'
  )
  writeFileSync(
    resolve(output, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BorrowLah email previews</title></head><body style="margin:32px;background:#f4f4ee;color:#111111;font:16px/1.8 system-ui,sans-serif"><h1>BorrowLah email previews</h1><p>Example data only. These links do not send email or authenticate anyone.</p><ul>${links.join("")}</ul></body></html>`
  )
  console.log(`Preview gallery: ${resolve(output, "index.html")}`)
}

if (exportConfig) {
  const output = resolve("test-results/email-previews")
  mkdirSync(output, { recursive: true })
  const payload: Record<string, string> = {}
  for (const template of emailTemplates) {
    const key =
      template.category === "notification"
        ? `${template.key}_notification`
        : template.key
    payload[`mailer_subjects_${key}`] = template.subject
    payload[`mailer_templates_${key}_content`] = renderEmail(template)
  }
  const file = resolve(output, "supabase-auth-email-config.json")
  writeFileSync(file, JSON.stringify(payload, null, 2) + "\n")
  console.log(`Reviewable hosted Auth email configuration: ${file}`)
}
