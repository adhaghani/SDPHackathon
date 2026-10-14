# BorrowLah progress

Status: **Readiness fixes verified locally; cloud preview and human pilot pending**

Legend: `[ ]` not started · `[~]` in progress · `[x]` complete · `[!]` blocked

## Phase 0 — Foundation

- [x] Read the entire build brief
- [x] Inspect repository and installed Next.js/shadcn conventions
- [x] Create `docs/PLAN.md`
- [x] Create `PROGRESS.md`
- [x] Write and review `docs/DESIGN_PLAN.md` against section 8
- [x] Create `docs/DECISIONS.md`
- [x] Configure package scripts and quality gates
- [x] Add required shadcn components
- [x] Implement design tokens, fonts and comfort-setting foundation
- [x] Add `.env.example` and typed Supabase clients
- [x] Add auth pages, callback and protected-route redirect
- [x] Add app shell and responsive navigation
- [x] Add `/api/health`
- [x] Add PWA manifest and icons
- [x] Add Vitest and GitHub Actions
- [x] Verify lint, typecheck, unit tests, build and database tests
- [x] Verify sign-up/sign-in with local Supabase through Playwright
- [ ] Supply human-only Supabase/Vercel instructions when reached

## Phase 1 — Core loop

- [x] Module A: membership, join and profile
- [x] Module B: events and QR check-in
- [x] Module C: borrow/lend booking state machine
- [x] Module D: points, rules, levels, badges and history
- [x] Module J: resident home
- [x] Module H: first Township Pulse
- [x] Seed and demo mode
- [x] RLS and database tests
- [x] Phase 1 checkpoint gates and demo rehearsal

## Phase 2 — Engagement and trust

- [x] Rewards catalogue and redemption
- [x] Challenges
- [x] Notifications and scheduled jobs
- [x] Announcements, help requests and groups
- [x] Waitlists, volunteer hours and event completion
- [x] Booking chat, notes and disputes
- [x] Reports, moderation and blocks
- [x] Comfort settings
- [x] Phase 2 checkpoint gates

## Phase 3 — Insight and impact

- [x] Insights and planning suggestions
- [x] Budget and pilot comparison
- [x] Rewards economy and suspicious activity
- [x] CSV export and methodology
- [x] Audit-logged raw-record access
- [~] Phase 3 checkpoint gates

## Phase 4 — Polish and delivery

- [x] Accessibility pass
- [x] Performance pass
- [x] Loading/empty/error audit
- [x] PWA install and keep-alive
- [x] Playwright golden-path test
- [x] Documentation deliverables
- [x] Fresh-clone rehearsal
- [x] Phase 4 checkpoint gates

## Phase 5 — Stretch

### Resident recycling tracking

- [x] Self-reported count/custom-kg logging, lifetime impact metrics and cited CO₂e/kWh factors
- [x] Popup estimate composer with current-date-only logging and optional EXIF-stripped photos
- [x] Township recycling campaign with sea-turtle progress and idempotent 50 BP contributor reward
- [x] Resident home, `/recycling`, Engagement admin controls, methodology and tests

- [x] Recommendations v1 behind `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS`
- [x] Rotating event QR and QR handover/return behind `NEXT_PUBLIC_ENABLE_ROTATING_QR`
- [x] Sponsor portal behind `NEXT_PUBLIC_ENABLE_SPONSOR_PORTAL`
- [x] AI search/admin summary behind `NEXT_PUBLIC_ENABLE_AI_SEARCH`
- [x] Community equipment hubs behind `NEXT_PUBLIC_ENABLE_EQUIPMENT_HUBS`
- [x] Multi-township switcher behind `NEXT_PUBLIC_ENABLE_MULTI_TOWNSHIP`
- [x] Bahasa Malaysia UI behind `NEXT_PUBLIC_ENABLE_BM_UI`
- [x] Leaflet neighbourhood map behind `NEXT_PUBLIC_ENABLE_LEAFLET`
- [x] Phase 5 checkpoint gates

## Verification log

| Date       | Gate                            | Result                            |
| ---------- | ------------------------------- | --------------------------------- |
| 2026-10-11 | Brief read and repository audit | Complete                          |
| 2026-10-11 | `npm run lint`                  | Pass                              |
| 2026-10-11 | `npm run typecheck`             | Pass                              |
| 2026-10-11 | `npm test`                      | Pass — 3 unit tests               |
| 2026-10-11 | `npm run test:db`               | Pass — 2 pgTAP tests              |
| 2026-10-11 | `npm run build`                 | Pass                              |
| 2026-10-11 | `npm run test:e2e`              | Pass — sign-up, sign-out, sign-in |
| 2026-10-11 | `npm run test:e2e`              | Pass — join code → active membership → Home |
| 2026-10-11 | `npm run demo:reset`            | Pass — Aisyah balance restored to 1,250 BP |
| 2026-10-11 | `npm run test:db`               | Pass — 17 core-loop/foundation tests |
| 2026-10-11 | `npm run lint && npm run typecheck && npm test && npm run build` | Pass |
| 2026-10-11 | `npm run demo:reset` | Pass — engagement data restored, Aisyah 1,250 BP |
| 2026-10-11 | `npm run test:db` | Pass — 19 tests including capacity, RLS and scheduled-job idempotency |
| 2026-10-11 | Manual moderation rehearsal | Pass — report → office review → hide target |
| 2026-10-11 | `npm run lint && npm run typecheck && npm test && npm run build` | Pass |
| 2026-10-11 | `npm run test:db` | Pass — 19 tests |
| 2026-10-11 | Admin insights/budget/economy/export rehearsal | Pass |
| 2026-10-11 | `npm run test:e2e -- accessibility.spec.ts` | Pass — 2 WCAG A/AA scans |
| 2026-10-11 | `npm run test:e2e -- core-loop.spec.ts` | Pass — role switcher, event check-in, borrow discovery, rewards |
| 2026-10-11 | `npm run test:e2e -- booking-flow.spec.ts` | Pass — approve, two-sided handover, return, completed |
| 2026-10-11 | Local performance measurement | Home FCP/LCP ≈ 256 ms; Pulse load ≈ 536 ms |
| 2026-10-11 | `npm run test:e2e` | Pass — 5 tests: accessibility, booking flow, core loop, auth |
| 2026-10-11 | `npm run lint && npm run typecheck && npm test && npm run test:db && npm run build` | Pass |
| 2026-10-14 | `npx supabase db reset && npm run seed && npm run test:db` | Pass — 28 recycling pgTAP tests |
| 2026-10-14 | `npm run lint && npm run typecheck && npm test && npm run build` | Pass |
| 2026-10-14 | `npx playwright test e2e/recycling.spec.ts` | Pass — logging, home refresh and reduced motion |
| 2026-10-14 | Full `npm run test:e2e` | Recycling, accessibility and responsive suites pass; booking-flow and sign-out auth failures reproduce independently and are outside recycling scope |
| 2026-10-14 | Navigation route audit | Resident and admin sidebar/drawer routes expanded; mobile bottom nav verified at exactly five primary tabs |
| 2026-10-14 | `npx playwright test e2e/navigation.spec.ts` | Pass — fixed top-right mobile drawer, route links and admin tools |
| 2026-10-14 | `npx playwright test e2e/responsive.spec.ts` | Pass — 320/390/768/1440px route overflow audit |
| 2026-10-14 | `npx playwright test e2e/recycling.spec.ts` | Pass — popup composer, current-date-only input, photo upload and persistence |
| 2026-10-14 | `npm run test:db` | Pass — 192 tests including photo-path validation and persistence |
| 2026-10-11 | Fresh clone `npm ci --ignore-scripts` | Blocked by npm `ECONNRESET`; local install and all gates pass |
| 2026-10-11 | Fresh clone retry `npm ci --ignore-scripts --prefer-offline` | Pass — install in 29s |
| 2026-10-11 | Fresh clone lint/typecheck/test/build | Pass |
| 2026-10-11 | `npm run test:e2e` after trust/preferences changes | Pass — 5 tests |
| 2026-10-11 | Manual profile export/delete and notification preference rehearsal | Pass |
| 2026-10-11 | `npm run test:e2e -- accessibility.spec.ts` after PWA/photo changes | Pass |
| 2026-10-11 | `npm run lint && npm run typecheck && npm test && npm run build` after PWA/photo changes | Pass |
| 2026-10-11 | PWA service-worker rehearsal | Pass — `/sw.js` served and registered in Chromium |
| 2026-10-11 | Phase 5.1 recommendations | Pass — explainable helper tests and Home integration |
| 2026-10-11 | Phase 5.2 rotating QR | Pass — flag-controlled 60-second ticket lifecycle and local gates |
| 2026-10-11 | Phase 5.3 sponsor portal | Pass — partner account seed, aggregate stats, reward/challenge creation RPCs and local gates |
| 2026-10-11 | Phase 5.4 AI search/admin summary | Pass — deterministic parser/fallback tests and local gates |
| 2026-10-11 | Phase 5.5 equipment hubs | Pass — hub/inventory/checkout RPCs and local gates |
| 2026-10-11 | Phase 5.6 multi-township switcher | Pass — seeded second township and Profile switcher behind flag |
| 2026-10-11 | Phase 5.7 Bahasa Malaysia UI | Pass — landing/home/nav copy switcher and local gates |
| 2026-10-11 | Phase 5.8 Leaflet map | Pass — lazy-loaded neighbourhood-level OSM map and accessibility scan |
| 2026-10-11 | `npm run test:e2e` | Pass — 5 tests after Phase 5 additions |
| 2026-10-11 | `npm run lint && npm run typecheck && npm test && npm run test:db && npm run build` | Pass |


## Readiness improvements — 14 October 2026

- [x] Fix booking availability: return occupied date windows through a membership-checked RPC instead of querying other residents' private booking rows.
- [x] Correct two-sided handover progress and waiting states; keep admin review separate from participant confirmation controls.
- [x] Harden sign-out with unique form IDs, pending/error feedback, local-session sign-out, township-cookie cleanup and layout revalidation. Forward refreshed auth cookies to the current server request.
- [x] Verify new join → calendar request → approval → two-sided handover → return → exactly-once points at 390px and 1440px.
- [x] Add Home **Your next step** for approvals, handovers, returns and upcoming tickets, with one action per task.
- [x] Isolate optional Home service failures and provide section retry controls. Render tests cover rejected recycling requests and error responses while borrowing/events remain usable.
- [x] Remove illustrative walking times and hardcoded BP amounts from the affected public/Home/admin surfaces. Use active reward rules for event and booking previews and explain verification/caps.
- [x] Correct search-event counting, separate private 30-day resident deduplication, suppress small distinct-demand groups, and label anonymous legacy demo data honestly.
- [x] Connect category demand, current hub inventory, confirmed completed hub loans, listing utilisation and current-month programme costs. Document attribution and period limits.
- [x] Label campaign progress as self-reported estimates and explain that no measured staff collection stream exists. Document requirements for a future separate measured stream.
- [x] Confirm owner/admin unit-label policy with the project owner; restrict full profiles to their owner and expose co-member names through a narrow view; align conflicting privacy documentation.
- [x] Prepare a 180-second script centred on borrowing, verified participation, BetterPoints and township outcomes.
- [x] Prepare cloud configuration/runbook, dedicated preview test support, pilot protocol and blank observation sheet.
- [!] Cloud preview: no remote Supabase project exists; Vercel CLI has no saved authentication. Project/account setup is required before deployment.
- [ ] Run physical phone/laptop checks and record an actual spoken rehearsal duration.
- [ ] Recruit consenting residents and execute the pilot. No real pilot observations have been collected.

### Verification

| Gate | Result |
| --- | --- |
| Production build and TypeScript | Pass |
| ESLint and diff whitespace check | Pass |
| Vitest | Pass — 83 tests, including Home failure rendering and session-cookie propagation |
| Supabase pgTAP | Pass — 219 assertions across 12 files |
| Production Playwright suite | 14 passed in the full run; both corrected organiser tests passed on targeted rerun — all 16 scenarios verified |
| Resident workflow | Pass at 390px and 1440px, with exactly one lender and borrower award per completed loan |
| Organiser and office journeys | Pass at 390px and 1440px |
| Responsive audit | Pass at 320/390/768/1440px |
| Accessibility, guest passes, navigation, sign-out and recycling | Pass |
| Visual review | Home and demand dashboard inspected at 390px and 1440px |
| Cloud, physical devices, spoken timing, resident pilot | Pending; do not describe local browser evidence as completion of these checks |

The dev server showed long action delays under local machine load. Final functional evidence comes from `next build` + `next start`, with `E2E_SKIP_RESET=true E2E_PRODUCTION=true npm run test:e2e --workspace web`. The organiser rerun corrected a test that checked registration before the streamed control was ready and matched hidden accessibility text. The booking test now asserts the actual **With borrower** label and verifies the two-sided state machine rather than assuming the first confirmation completes handover.


## Goal handoff — 14 October 2026

The project owner requested that the implementation goal be considered completed and the outstanding work be handed off as todos. The root [README.md](README.md#remaining-todos) now contains the cloud preview, physical-device rehearsal, timed presentation and resident pilot checklists. These external tasks remain uncompleted; closing the goal does not claim that deployment or field validation occurred.
