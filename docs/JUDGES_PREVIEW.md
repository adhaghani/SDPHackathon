# Judges preview

This branch adds an isolated, authentication-free preview. Set `NEXT_PUBLIC_JUDGES_PREVIEW=true` at build and runtime to enable it. The default is off: normal deployments retain the production landing page and session proxy.

## Local use

From the repository root:

```sh
NEXT_PUBLIC_JUDGES_PREVIEW=true npm run dev --workspace web
```

Open `/`, then choose a perspective:

- `/preview/resident`: search/filter/save items, simulate a complete borrowing journey, RSVP to the sample event, add a sample recycling log, and redeem a fictional reward.
- `/preview/manager`: filter seeded reporting periods, approve/decline a sample membership, and inspect illustrative planning signals.
- `/preview/guard`: look up fixed sample pass codes, simulate an identity check, and check valid visitors in/out. The expired sample cannot enter.
- `/preview/event`: search/filter registrations and check in seeded attendees. Aisyah appears after an RSVP in the resident view.

The preview uses versioned `sessionStorage`, shared across perspectives in the same browser tab. Reset demo restores all four views. Closing the tab ends the session. Storage failure falls back to the current page's in-memory interactions. No sample people are real. No database seeding or migration is needed.

The preview proxy returns before constructing any Supabase client. It blocks API requests and all non-read requests, including server action POSTs, and redirects live app pages to the overview. Preview pages are unavailable when the flag is off. PWA registration is disabled for this deployment. Unsupported actions explain the limitation in a toast. Do not add production server actions or Supabase clients to preview components.

## Branch hosting on the existing Vercel project

1. Keep `borrowlah.my` and `www.borrowlah.my` assigned to the existing production branch.
2. Add `NEXT_PUBLIC_JUDGES_PREVIEW=true` to the **Preview** environment, scoped specifically to `judges-preview`. Do not set it project-wide or for Production. Since it is public, rebuild after changing it.
3. Add `judges.borrowlah.my` under the existing `borrowlah` project's domains, assigning it to the `judges-preview` Git branch.
4. Configure the `judges` DNS record at Cloudflare with the exact CNAME target shown by Vercel. Preserve the existing apex and www records. Vercel can verify the record and provision TLS after it resolves.
5. Deploy this branch to Preview. Do not promote it to Production. Confirm anonymous visitors can access the branch domain; project preview protection may otherwise show a Vercel sign-in screen.
6. Verify the custom domain shows “Seeded demo data”, all four perspectives work without auth, API/POST requests are blocked, and production still serves the live app.

Official instructions: [Assigning a domain to a Git branch](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch).

## Suggested walkthrough (3–5 minutes)

1. Read the overview and demo disclosure.
2. Resident: open Pressure washer and advance through all six steps. Both pick-up confirmations and both return steps are required. Completion does not issue real points.
3. Resident → Events: join the garden morning.
4. Event organiser: find Aisyah and check her in. Search and attendance filters work.
5. Guard: look up DEMO-1024, simulate identity sighted, check in, then check out. Try DEMO-EXPIRED.
6. Manager: review Nur Hana's membership and inspect the sample pulse/planning signals.
7. Use Reset demo before sharing the device with another judge.

Seeded dates are fixed in October 2026 and labelled as samples. Guard validity is a fixed scenario rather than a wall-clock check. All quantities and BetterPoints are illustrative. Recycling is self-reported; no validated sustainability or pilot outcome is claimed.

## Design verification

The preview extends BorrowLah’s existing lime, ink, and paper identity, as confirmed in `apps/web/PRODUCT.md`. The incumbent references are `packages/ui/src/styles/globals.css` and `apps/web/app/landing.module.css`: lime `#d9f45a`, ink `#111111`, paper `#f4f4ee`, Bricolage headings, Instrument body text, rounded surfaces, and community illustrations. The preview retains those foundations in `apps/web/components/judges/judges.module.css`, reuses `BrandLogo` and the township garden illustration, and keeps its presentation scoped to the judges components. This is a page extension; it introduces no global token or design-system change.

Local verification covered the overview and all four perspectives:

- Desktop/mobile screenshot pairs in `output/playwright/judges/` passed visual review with no material fixes remaining; the mechanical design detector returned no findings.
- Automated axe checks found zero WCAG 2 A/AA or WCAG 2.1 AA violations on all five pages. No horizontal overflow was found at 320, 390, 768, or 1440 pixels.
- All 18 functional browser checks passed, with no page errors or Supabase calls. Build, lint, typecheck, and 45 targeted tests passed.

These checks describe the local preview. They do not establish deployment or custom-domain status.
