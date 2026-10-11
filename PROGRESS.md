# BorrowBetter progress

Status: **Phase 0 checkpoint ready**

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

- [ ] Module A: membership, join and profile
- [ ] Module B: events and QR check-in
- [ ] Module C: borrow/lend booking state machine
- [ ] Module D: points, rules, levels, badges and history
- [ ] Module J: resident home
- [ ] Module H: first Township Pulse
- [ ] Seed and demo mode
- [ ] RLS and database tests
- [ ] Phase 1 checkpoint gates and demo rehearsal

## Phase 2 — Engagement and trust

- [ ] Rewards catalogue and redemption
- [ ] Challenges
- [ ] Notifications and scheduled jobs
- [ ] Announcements, help requests and groups
- [ ] Waitlists, volunteer hours and event completion
- [ ] Booking chat, photos and disputes
- [ ] Reports, moderation and blocks
- [ ] Comfort settings
- [ ] Phase 2 checkpoint gates

## Phase 3 — Insight and impact

- [ ] Insights and planning suggestions
- [ ] Budget and pilot comparison
- [ ] Rewards economy and suspicious activity
- [ ] CSV export and methodology
- [ ] Audit-logged raw-record access
- [ ] Phase 3 checkpoint gates

## Phase 4 — Polish and delivery

- [ ] Accessibility pass
- [ ] Performance pass
- [ ] Loading/empty/error audit
- [ ] PWA install and keep-alive
- [ ] Playwright golden-path test
- [ ] Documentation deliverables
- [ ] Fresh-clone rehearsal
- [ ] Phase 4 checkpoint gates

## Phase 5 — Stretch

- [ ] Only after Phase 4 passes; keep each item behind a feature flag

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
