# BorrowBetter progress

Status: **Phase 5 stretch in progress**

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

- [x] Recommendations v1 behind `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS`
- [ ] Rotating event QR and QR handover/return
- [ ] Sponsor portal
- [ ] AI search/admin summary
- [ ] Community equipment hubs
- [ ] Multi-township analytics
- [ ] Bahasa Malaysia UI
- [ ] Leaflet neighbourhood map

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
| 2026-10-11 | Fresh clone `npm ci --ignore-scripts` | Blocked by npm `ECONNRESET`; local install and all gates pass |
| 2026-10-11 | Fresh clone retry `npm ci --ignore-scripts --prefer-offline` | Pass — install in 29s |
| 2026-10-11 | Fresh clone lint/typecheck/test/build | Pass |
| 2026-10-11 | `npm run test:e2e` after trust/preferences changes | Pass — 5 tests |
| 2026-10-11 | Manual profile export/delete and notification preference rehearsal | Pass |
| 2026-10-11 | `npm run test:e2e -- accessibility.spec.ts` after PWA/photo changes | Pass |
| 2026-10-11 | `npm run lint && npm run typecheck && npm test && npm run build` after PWA/photo changes | Pass |
| 2026-10-11 | PWA service-worker rehearsal | Pass — `/sw.js` served and registered in Chromium |
| 2026-10-11 | Phase 5.1 recommendations | Pass — explainable helper tests and Home integration |
