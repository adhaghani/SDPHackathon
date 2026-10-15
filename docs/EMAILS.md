# BorrowLah email design

All email currently sent by this application goes through Supabase Auth. Resend is not connected to an application notification sender. In-app notifications remain in-app; these changes do not add booking or reward emails.

The email source is [emails/borrowlah.ts](../emails/borrowlah.ts). It generates 13 standalone HTML templates in [supabase/templates](../supabase/templates), configured in `supabase/config.toml`.

## Covered messages

| Supabase template | Purpose |
| --- | --- |
| `confirmation` | Confirm registration; also handles first-time manager invitations sent through email OTP |
| `magic_link` | Passwordless sign-in; manager invitations use tailored content when redirected to `/manager-invitation` |
| `invite` | Auth admin invitations |
| `recovery` | Password recovery email |
| `email_change` | Confirm an email change, including double-confirmation flows |
| `reauthentication` | A verification code for a sensitive account operation |
| `password_changed`, `email_changed`, `phone_changed` | Account-change security notices |
| `identity_linked`, `identity_unlinked` | Sign-in method security notices |
| `mfa_factor_enrolled`, `mfa_factor_unenrolled` | Verification-method security notices |

The seven security notification types retain the existing disabled defaults locally. Their custom templates are ready when a type is enabled. Template configuration does not add new application screens or enable password recovery, phone, social sign-in or MFA flows that the app does not currently expose.

## Design and compatibility

The templates use BorrowLah's paper `#f4f4ee`, ink `#111111`, lime `#d9f45a` and orange `#ff5a36`. They have a dark wordmark header, generous body spacing, rounded action buttons and a Reduce/Reuse/Recycle footer. No external images, tracking pixels, scripts or font downloads are required.

Email clients often block web fonts. The existing Bricolage Grotesque and Instrument Sans family names are followed by email-safe system fallbacks. Tables, inline styles, explicit colours and a mobile media query keep the content readable when advanced CSS is unavailable. Outlook can show square corners without losing content or actions. Browser checks do not substitute for inbox testing in Outlook, Gmail or Apple Mail.

Authentication actions retain Supabase's `{{ .ConfirmationURL }}` in both the button and a copyable fallback link. Reauthentication retains `{{ .Token }}` as a code, without an unrelated sign-in button. Manager copy is selected from the per-message redirect URL, not a role in editable user metadata. Configure Site URL and `NEXT_PUBLIC_APP_URL` consistently; the manager variant accepts the Site URL with or without a trailing slash. A redirect to a different preview domain uses generic Auth copy while keeping the link functional.

## Edit and preview

```bash
npm run emails:build
npm run emails:check
npm run emails:preview
```

Edit the shared source, then rebuild. `emails:check` fails when a generated HTML file is missing or out of date. The preview command generates `test-results/email-previews/index.html`, with example data for all templates plus a manager invitation. Open that file in a browser. Preview links are illustrative, not valid authentication links.

## Use locally without Resend

After changing templates or their config, restart local Supabase:

```bash
npx supabase stop
npx supabase start
```

This preserves local database data. Do not run `demo:reset`, `db reset`, or `stop --no-backup` to update email designs.

Trigger a sign-in email or create a manager invitation, then view it at [the local inbox](http://127.0.0.1:54324). Local Auth mail uses the BorrowLah sender name and `no-reply@borrowlah.test`; it is captured locally rather than delivered to a real mailbox.

Authentication template paths in the installed CLI resolve from the repository root (`./supabase/templates/...`). Security notification paths resolve from the `supabase/` directory (`./templates/...`). Keep those conventions when adding another template.

## Hosted Supabase

Database migrations and Vercel deployment do not install Auth email templates. In the hosted Supabase dashboard, open **Authentication → Email Templates**, then copy each generated HTML file and its subject from `supabase/config.toml` into the matching template. Configure the sender name and a verified sender address in hosted Auth SMTP settings.

For a reviewable Management API payload, run:

```bash
npm run emails:export
```

This creates `test-results/email-previews/supabase-auth-email-config.json` with subjects and template content for all 13 types. It does not make an API request, change notification-enabled settings, or contain credentials. It can be used with the [Supabase Management API](https://supabase.com/docs/guides/auth/auth-email-templates#editing-email-templates) when deploying the templates later.

Keep the existing Auth Site URL and redirect allowlist, including `/auth/callback` and `/manager-invitation`. The HTML design is independent of the SMTP delivery provider, so it works with local captured email now and hosted SMTP later.
