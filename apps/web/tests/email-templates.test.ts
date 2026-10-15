import { describe, expect, it } from "vitest"
import {
  emailTemplates,
  previewEmail,
  renderEmail,
} from "../../../emails/borrowlah"

describe("BorrowLah email templates", () => {
  it("covers every Auth and security-notification template", () => {
    expect(
      emailTemplates
        .filter((t) => t.category === "template")
        .map((t) => t.key)
        .sort()
    ).toEqual([
      "confirmation",
      "email_change",
      "invite",
      "magic_link",
      "reauthentication",
      "recovery",
    ])
    expect(
      emailTemplates.filter((t) => t.category === "notification")
    ).toHaveLength(7)
  })
  it("keeps authentication links and code-only reauthentication intact", () => {
    for (const template of emailTemplates.filter(
      (t) => t.category === "template"
    )) {
      const html = renderEmail(template)
      if (template.key === "reauthentication") {
        expect(html).toContain("{{ .Token }}")
        expect(html).not.toContain("{{ .ConfirmationURL }}")
      } else {
        expect(html.match(/href="\{\{ \.ConfirmationURL \}\}"/g)).toHaveLength(
          2
        )
      }
    }
  })
  it.each(["confirmation", "magic_link", "invite"])(
    "distinguishes manager invitations from ordinary %s emails",
    (key) => {
      const template = emailTemplates.find((t) => t.key === key)!
      const source = renderEmail(template)
      const manager = previewEmail(source, true)
      const regular = previewEmail(source)
      expect(manager).toContain("You’re invited to help lead.")
      expect(manager).toContain("Review my manager invitation")
      expect(regular).toContain(template.title)
      expect(regular).not.toContain("You’re invited to help lead.")
      expect(source).toContain(".RedirectTo")
      expect(source).not.toContain(".Data")
    }
  )
  it("uses standalone email-safe HTML without scripts or required external assets", () => {
    for (const template of emailTemplates) {
      const html = renderEmail(template)
      expect(html).toContain('lang="en"')
      expect(html).toContain('role="presentation"')
      expect(html).toContain("#d9f45a")
      expect(html).toContain("Reduce.")
      expect(html).not.toMatch(/<(script|form|iframe|img)\b/i)
      expect(html).not.toContain("fonts.googleapis")
      expect(html).not.toMatch(/\b(display:grid|display:flex|box-shadow)\b/)
      expect(previewEmail(html)).not.toContain("{{")
    }
  })
})
