/** Source of truth for Supabase's generated, standalone HTML email templates. */
export type EmailTemplate = {
  key: string
  category: "template" | "notification"
  subject: string
  title: string
  description: string
  action?: string
  detail?: string
  managerVariant?: boolean
}

export const emailTemplates: EmailTemplate[] = [
  {
    key: "confirmation",
    category: "template",
    subject: "Confirm your BorrowLah email",
    title: "A better neighbourhood starts with you.",
    description:
      "Confirm your email address to finish setting up your BorrowLah account. Then you can join your township and start sharing more with the people nearby.",
    action: "Confirm my email",
    managerVariant: true,
  },
  {
    key: "invite",
    category: "template",
    subject: "You’re invited to BorrowLah",
    title: "There’s a place for you here.",
    description:
      "You’ve been invited to join BorrowLah. Open your invitation to set up your account and take the next step with your community.",
    action: "Open my invitation",
    managerVariant: true,
  },
  {
    key: "magic_link",
    category: "template",
    subject: "Your BorrowLah sign-in link",
    title: "Good to have you back.",
    description:
      "Use this secure, one-time link to sign in to BorrowLah. Your neighbourhood is ready when you are.",
    action: "Sign in to BorrowLah",
    managerVariant: true,
  },
  {
    key: "recovery",
    category: "template",
    subject: "Reset your BorrowLah password",
    title: "Let’s get you back in.",
    description:
      "We received a request to reset the password for your BorrowLah account. Follow the secure link below to continue resetting your password.",
    action: "Reset my password",
  },
  {
    key: "email_change",
    category: "template",
    subject: "Confirm your BorrowLah email change",
    title: "A new email. The same community.",
    description:
      "Confirm this request to change the email address on your BorrowLah account. You may need to confirm the change from both email addresses.",
    action: "Confirm email change",
    detail: "Requested email address: <strong>{{ .NewEmail }}</strong>",
  },
  {
    key: "reauthentication",
    category: "template",
    subject: "Your BorrowLah verification code",
    title: "A quick check that it’s you.",
    description:
      "Enter this verification code in BorrowLah to continue with the sensitive account change you requested.",
  },
  {
    key: "password_changed",
    category: "notification",
    subject: "Your BorrowLah password was changed",
    title: "Your password has changed.",
    description:
      "The password for your BorrowLah account was changed. If you made this change, you don’t need to do anything else.",
  },
  {
    key: "email_changed",
    category: "notification",
    subject: "Your BorrowLah email address was changed",
    title: "Your email address has changed.",
    description:
      "The email address used for your BorrowLah account has been updated.",
    detail:
      "Previous address: <strong>{{ .OldEmail }}</strong><br>Current address: <strong>{{ .Email }}</strong>",
  },
  {
    key: "phone_changed",
    category: "notification",
    subject: "Your BorrowLah phone number was changed",
    title: "Your phone number has changed.",
    description:
      "The phone number associated with your BorrowLah account has been updated.",
    detail:
      "Previous number: <strong>{{ .OldPhone }}</strong><br>Current number: <strong>{{ .Phone }}</strong>",
  },
  {
    key: "identity_linked",
    category: "notification",
    subject: "A sign-in method was added to BorrowLah",
    title: "A new way to sign in.",
    description: "A sign-in method was linked to your BorrowLah account.",
    detail: "Sign-in provider: <strong>{{ .Provider }}</strong>",
  },
  {
    key: "identity_unlinked",
    category: "notification",
    subject: "A sign-in method was removed from BorrowLah",
    title: "A sign-in method was removed.",
    description: "A sign-in method was unlinked from your BorrowLah account.",
    detail: "Removed provider: <strong>{{ .Provider }}</strong>",
  },
  {
    key: "mfa_factor_enrolled",
    category: "notification",
    subject: "A verification method was added to BorrowLah",
    title: "Another layer of account protection.",
    description: "A verification method was added to your BorrowLah account.",
    detail: "Verification method: <strong>{{ .FactorType }}</strong>",
  },
  {
    key: "mfa_factor_unenrolled",
    category: "notification",
    subject: "A verification method was removed from BorrowLah",
    title: "A verification method was removed.",
    description:
      "A verification method was removed from your BorrowLah account.",
    detail: "Removed method: <strong>{{ .FactorType }}</strong>",
  },
]

const managerDeclaration =
  '{{ $manager := or (eq .RedirectTo (printf "%s/manager-invitation" .SiteURL)) (eq .RedirectTo (printf "%smanager-invitation" .SiteURL)) }}'
const managerTitle = "You’re invited to help lead."
const managerDescription =
  "A BorrowLah superadmin invited you to manage a township. Open your invitation, choose a password, and review your appointment."
const branch = (manager: string, regular: string) =>
  `{{ if $manager }}${manager}{{ else }}${regular}{{ end }}`

export function renderEmail(template: EmailTemplate): string {
  const title = template.managerVariant
    ? branch(managerTitle, template.title)
    : template.title
  const description = template.managerVariant
    ? branch(managerDescription, template.description)
    : template.description
  const action = template.managerVariant
    ? branch("Review my manager invitation", template.action!)
    : template.action
  const notice =
    template.category === "notification"
      ? "If you did not make this change, secure your account and contact your township office through a trusted channel. Open BorrowLah using your usual address."
      : template.key === "reauthentication"
        ? "Never share this code. If you did not request it, do not enter it anywhere. You can ignore this email."
        : "This link is personal, expires, and can only be used once. If you did not request this email or expect an invitation, you can ignore it."
  const primary = action
    ? `
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="action-table" style="margin:28px 0 0;">
                    <tr><td bgcolor="#ff5a36" style="border:1px solid #111111;border-radius:28px;text-align:center;">
                      <a href="{{ .ConfirmationURL }}" style="display:block;padding:16px 24px;border-radius:28px;color:#111111;font-size:16px;font-weight:700;line-height:24px;text-decoration:none;mso-padding-alt:16px 24px;">${action}</a>
                    </td></tr>
                  </table>
                  <p style="margin:24px 0 8px;color:#3a3a3a;font-size:13px;line-height:20px;">Button not opening? Copy this full link into your browser:</p>
                  <p style="margin:0;font-size:12px;line-height:20px;word-break:break-all;overflow-wrap:anywhere;"><a href="{{ .ConfirmationURL }}" style="color:#111111;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>`
    : template.key === "reauthentication"
      ? `
                  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td bgcolor="#d9f45a" style="padding:24px 12px;border-radius:16px;text-align:center;font-size:28px;font-weight:700;letter-spacing:4px;line-height:36px;color:#111111;">{{ .Token }}</td></tr></table>`
      : ""
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <title>${template.subject}</title>
  <style>
    body { margin:0; padding:0; width:100% !important; }
    table { border-collapse:separate; border-spacing:0; }
    a { color:#111111; }
    @media only screen and (max-width:620px) {
      .outer-pad { padding:16px 10px !important; }
      .content-pad { padding:28px 22px !important; }
      .email-title { font-size:30px !important; line-height:34px !important; }
      .action-table { width:100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4ee;color:#111111;font-family:'Instrument Sans','Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%;">
  ${template.managerVariant ? managerDeclaration : ""}
  <div style="display:none;font-size:1px;line-height:1px;color:#f4f4ee;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${description}</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f4ee">
    <tr><td align="center" class="outer-pad" style="padding:40px 16px;">
      <!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
        <tr><td bgcolor="#111111" style="padding:24px 30px;border-radius:20px 20px 0 0;">
          <a href="{{ .SiteURL }}" style="color:#d9f45a;font-family:'Bricolage Grotesque','Trebuchet MS',Arial,sans-serif;font-size:28px;font-weight:800;letter-spacing:-0.7px;line-height:34px;text-decoration:none;">BorrowLah</a>
          <p style="margin:5px 0 0;color:#f4f4ee;font-size:13px;line-height:20px;">Share more. Connect more. Live better.</p>
        </td></tr>
        <tr><td bgcolor="#ffffff" class="content-pad" style="padding:38px 34px;border-right:1px solid #e4e4dc;border-left:1px solid #e4e4dc;">
          <h1 class="email-title" style="margin:0;color:#111111;font-family:'Bricolage Grotesque','Trebuchet MS',Arial,sans-serif;font-size:36px;font-weight:800;letter-spacing:-0.8px;line-height:40px;">${title}</h1>
          <p style="margin:22px 0 0;color:#3a3a3a;font-size:16px;line-height:26px;">${description}</p>
          ${template.detail ? `<p style="margin:20px 0 0;padding:16px;background-color:#f4f4ee;border-radius:12px;color:#111111;font-size:14px;line-height:24px;word-break:break-word;">${template.detail}</p>` : ""}
          ${primary}
          <p style="margin:28px 0 0;padding-top:24px;border-top:1px solid #e4e4dc;color:#3a3a3a;font-size:13px;line-height:21px;">${notice}</p>
        </td></tr>
        <tr><td bgcolor="#d9f45a" style="padding:19px 22px;border-radius:0 0 20px 20px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
            <td width="33%" style="text-align:center;color:#111111;font-size:13px;font-weight:700;line-height:20px;">Reduce.</td>
            <td width="34%" style="border-left:1px solid #111111;border-right:1px solid #111111;text-align:center;color:#111111;font-size:13px;font-weight:700;line-height:20px;">Reuse.</td>
            <td width="33%" style="text-align:center;color:#111111;font-size:13px;font-weight:700;line-height:20px;">Recycle.</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:22px 16px 0;text-align:center;color:#3a3a3a;font-size:12px;line-height:20px;word-break:break-word;">
          <p style="margin:0;">An account email for {{ .Email }}.</p>
          <p style="margin:6px 0 0;"><a href="{{ .SiteURL }}" style="color:#111111;text-decoration:underline;">Open BorrowLah</a> &nbsp;·&nbsp; Small actions. A shared future.</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>
`
}

/** Example data only. Production rendering and HTML escaping belong to GoTrue. */
export function previewEmail(source: string, manager = false): string {
  const values: Record<string, string> = {
    ConfirmationURL:
      "https://borrowlah.example/auth/confirm?example=preview-only&amp;type=email",
    SiteURL: "https://borrowlah.example",
    Email: "neighbour@example.com",
    NewEmail: "new-neighbour@example.com",
    OldEmail: "previous@example.com",
    Token: "482619",
    Phone: "+60 12 000 0000",
    OldPhone: "+60 12 111 1111",
    Provider: "Google",
    FactorType: "Authenticator app",
  }
  return source
    .replace(managerDeclaration, "")
    .replace(
      /\{\{ if \$manager \}\}([\s\S]*?)\{\{ else \}\}([\s\S]*?)\{\{ end \}\}/g,
      (_match, invited, regular) => (manager ? invited : regular)
    )
    .replace(/\{\{ \.(\w+) \}\}/g, (_match, key: string) => values[key] ?? "")
}
