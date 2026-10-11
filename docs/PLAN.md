# BorrowBetter build plan

Source of truth: the BorrowBetter build brief at `/Users/adhaghani/.codex/attachments/9df3d731-810f-4604-bf06-48a2ee5c2d88/pasted-text-1.txt`. Re-read the relevant section before each slice.

## Working agreement

- Work in ordered phases. Do not start phase N+1 until phase N's Definition of Done passes.
- Vertical slice order: migration → database function → server action → UI → tests → one conventional commit.
- After every slice: `pnpm lint && pnpm typecheck && pnpm test` when pnpm is available; otherwise the equivalent npm scripts documented in `docs/DECISIONS.md`.
- At each phase checkpoint also run the build and database tests.
- Keep `PROGRESS.md` current. Log non-obvious choices in `docs/DECISIONS.md`.
- Never commit secrets. Stop for human-only Supabase/Vercel steps and provide exact instructions.

## Phase 0 — Foundation

| ID   | Task                                                                 | Acceptance criteria                                                                                                                                                                                                                                                                            |
| ---- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1  | Audit the existing monorepo and installed Next.js/shadcn conventions | Relevant guides in `node_modules/next/dist/docs/` and installed package types are checked before code is written                                                                                                                                                                               |
| 0.2  | Create planning documents                                            | `docs/PLAN.md`, `PROGRESS.md`, `docs/DESIGN_PLAN.md`, `docs/DECISIONS.md` exist and reflect the brief                                                                                                                                                                                          |
| 0.3  | Configure scripts, lint, format, typecheck and tests                 | Root/app scripts cover `dev`, `build`, `lint`, `typecheck`, `test`, `test:db`, `types:gen`, `db:push`, `seed`, `demo:reset`; CI runs lint, typecheck, tests and build                                                                                                                          |
| 0.4  | Add required shadcn components                                       | Button, card, dialog, sheet, drawer, tabs, badge, avatar, progress, calendar, form, input, select, textarea, table, sonner, skeleton, chart, command, dropdown-menu, tooltip, switch, checkbox, radio-group, alert, scroll-area and separator are available and composition rules are followed |
| 0.5  | Apply BorrowBetter design tokens and type                            | `globals.css` uses the Embun/Tinta/Pinjam/Jom/Tolong/Rimba/Emas system, dark variants, on-colour pairs, WCAG AA-safe choices, Bricolage Grotesque and Atkinson Hyperlegible roles, and comfort-setting hooks                                                                                   |
| 0.6  | Add Supabase foundation                                              | `.env.example`, generated-type placeholder, browser/server/admin clients, `server-only` admin module, request-interception session refresh and `/api/health` database probe                                                                                                                    |
| 0.7  | Add auth and app shell                                               | `/sign-in`, `/sign-up`, `/auth/callback`, `/onboarding` placeholders, protected-route redirect, mobile bottom navigation and desktop side navigation                                                                                                                                           |
| 0.8  | Add PWA basics and docs                                              | `manifest.ts`, icons, no offline caching, `docs/DESIGN_PLAN.md` wireframes reviewed against section 8                                                                                                                                                                                          |
| 0.9  | Run Phase 0 gates                                                    | `lint`, `typecheck`, unit tests, `build` and database tests pass; sign-up/sign-in work against Supabase; protected routes redirect; CI is green                                                                                                                                                |
| 0.10 | Human checkpoint                                                     | Supabase project/link/push/auth settings and Vercel preview instructions are supplied when reached                                                                                                                                                                                             |

Phase 0 DoD: sign-up and sign-in work against Supabase; protected routes redirect; CI is green; a Vercel preview deploys once the human supplies the link.

## Phase 1 — Core loop (demo-ready)

| ID  | Task                                               | Acceptance criteria                                                                                                                                                                                                              |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.A | Membership, township join and profile              | Wrong join code is clear without revealing township names; cross-township RLS isolation passes; pending members see only the holding screen; unit labels never appear to other residents                                         |
| 1.B | Events and QR check-in                             | Capacity never exceeds under concurrency; expired/screenshotted token rejected; staff cannot self-check-in; points once per attendee; cancelled events award nothing; host points require configured verified-attendee threshold |
| 1.C | Borrow, lend and booking state machine             | Double booking impossible; borrower cannot book own item; completion-only idempotent points; SQL permission matrix passes; messages restricted to participants; stale requests expire after 72 hours                             |
| 1.D | Ledger, rules, levels, badges, balance and history | No client insert path into ledger; repeated awards create one row; insufficient redemption fails clearly; balance equals ledger sum; badges once; levels derive from lifetime points                                             |
| 1.J | Resident home                                      | Balance and first To-do item render within 2 seconds on seeded data; every card has a meaningful empty state                                                                                                                     |
| 1.H | First Township Pulse                               | Section 6.8 metrics and three charts; aggregate-only queries; breakdowns under 5 suppressed; KPI definitions reproducible; target load under 2 seconds on seeded data                                                            |
| 1.S | Seed and demo mode                                 | Idempotent seed uses real RPCs, demo banner/role switcher/reset guard, Aisyah ends at exactly 1,250 BP, Contributor, 3 badges earned and 1 in progress                                                                           |
| 1.R | RLS and database tests                             | Every Phase 1 table has default-deny RLS; pgTAP tests cover isolation, idempotency/caps, RSVP concurrency, double booking, redemption balance and direct ledger insert                                                           |

Phase 1 DoD: the section 13 demo script runs end to end on phone and laptop with seeded data; all Phase 1 acceptance criteria pass; Lighthouse mobile accessibility ≥95 on Home, Events and Borrow.

## Phase 2 — Engagement and trust

| ID   | Task                                              | Acceptance criteria                                                                                                                  |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2.D  | Rewards catalogue and redemption                  | Balance/stock/per-user/validity checks, 8-character codes, admin use marking, idempotent balance deduction                           |
| 2.F  | Individual and community challenges               | Progress only from verified activity; one reward per user; no resident identities exposed                                            |
| 2.G  | Notifications and scheduled jobs                  | Realtime unread bell, deep links, per-type preferences; dedupe keys; scheduled jobs run twice with no duplicate effects              |
| 2.E  | Announcements, help and groups                    | Township-only reads; concurrent help acceptance yields one helper; requester-only completion; hidden content invisible to non-admins |
| 2.B2 | Waitlist, volunteer hours and complete-event flow | FIFO promotion, staff-verified hours, no-show handling, configured host points                                                       |
| 2.C2 | Booking chat, notes/photos and disputes           | Realtime participant-only chat; private signed photos; dispute window and one-time resolution points                                 |
| 2.I  | Reports, moderation and blocks                    | Three open reports auto-hide; server-enforced blocks; reporter status updates; audit-logged admin actions                            |
| 2.P  | Comfort settings                                  | Larger text, high contrast and reduce motion persist and apply at root; camera flows have non-camera alternatives                    |

Phase 2 DoD: all Phase 2 acceptance criteria pass; running scheduled jobs twice changes nothing; moderation flow works end to end.

## Phase 3 — Insight and impact

| ID  | Task                                    | Acceptance criteria                                                                                                           |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 3.I | Insights and planning suggestions       | Cohorts, weekday/time grid, suppressed neighbourhood participation, facility utilisation, suggestion evidence                 |
| 3.B | Budget and pilot comparison             | Programme costs, cost per verified attendee, indicative allocation, baseline comparison with non-causation banner             |
| 3.E | Rewards economy and suspicious activity | Issued/redeemed/outstanding/redemption rate, rule editor, catalogue, code use, manual-check-in share, pair repeats, reversals |
| 3.X | CSV export and methodology              | Aggregate-only CSV; every KPI traces to documented definition; methodology page published                                     |
| 3.A | Audit access                            | Any admin access to raw records writes `audit_log`                                                                            |

Phase 3 DoD: every KPI traces to its definition; small-group suppression test passes; raw-record access is audit-logged.

## Phase 4 — Polish and delivery

| ID  | Task                  | Acceptance criteria                                                                                                           |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 4.A | Accessibility         | axe and Lighthouse checks, keyboard-only run-through, screen-reader smoke test; mobile accessibility target measured honestly |
| 4.F | Performance           | Indexes, pagination and image sizes; Home LCP and Township Pulse timings measured and reported                                |
| 4.S | State coverage        | Every loading, empty and error state audited                                                                                  |
| 4.P | PWA and keep-alive    | Install check, health endpoint and scheduled ping workflow                                                                    |
| 4.E | End-to-end test       | Playwright golden path: join → RSVP → manual check-in → points → borrow flow → completion → dashboard increment               |
| 4.D | Documentation         | README and all section 13 docs, screenshots, architecture diagrams, demo script and reset runbook                             |
| 4.R | Fresh-clone rehearsal | Setup guide completes in under 20 minutes; clean build; no console errors on main flows; demo script rehearsed                |

Phase 4 DoD: fresh clone runs in under 20 minutes from `docs/SETUP.md`; `pnpm build` is clean; no console errors on main flows; demo script rehearsed.

## Phase 5 — Stretch (only after Phase 4)

Ordered, feature-flagged: recommendations v1 → rotating self-check-in QR and QR handover/return → sponsor portal → AI search/admin summary with deterministic fallback → equipment hubs → multi-township analytics → Bahasa Malaysia UI → Leaflet neighbourhood map.

### Stretch status

| ID | Item | Status |
| --- | --- | --- |
| 5.1 | Explainable rule-based recommendations | Done behind `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS` |
| 5.2 | Rotating event QR and QR handover/return | Done behind `NEXT_PUBLIC_ENABLE_ROTATING_QR`; rotating ticket lifecycle verified |
| 5.3 | Sponsor portal | Pending |
| 5.4 | AI search/admin summary | Pending |
| 5.5 | Community equipment hubs | Pending |
| 5.6 | Multi-township analytics | Pending |
| 5.7 | Bahasa Malaysia UI | Pending |
| 5.8 | Leaflet neighbourhood map | Pending |

## Checkpoint report format

At each phase checkpoint report only: what is done, commands and results, what is blocked, and what the human must do.
