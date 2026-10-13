# BorrowLah Feature Pack v2 — final report

## Delivered

All 16 requested features are implemented with sample data:

1. Borrower trust score, tiers, high-value gates, deposit waivers, condition ratings and contests.
2. Estimated money/value shared across bookings, item history and Impact.
3. Privacy-aware item history timeline.
4. Item manuals, safety notes, photo limits and first-guide BP.
5. Request board, category notifications, offers, accepted bookings and +15 BP request bonus.
6. Atomic bundle bookings with all-or-nothing availability checks.
7. Skill lending with duration, shared-space meetings and tuition guardian acknowledgement.
8. Snap to list through the provider-gated `lib/ai` module with a manual fallback.
9. Calendar-month streaks, milestone BP and streak badges.
10. Invite links/QR, signup attribution and capped two-sided invite rewards.
11. Opt-in Neighbour of the month with organiser approval.
12. Township carbon goals with factor/source gating and lazy threshold notifications.
13. Aggregate demand-gap panel, CSV rows and shared-library wishlist.
14. Heuristic predictive demand, official-source calendars and resident forecast nudges.
15. Signed 30-minute offline handover QR, IndexedDB queue, replay rejection and offline shell.
16. Article-grounded Help chat, no-AI fallback, booking-status read-only context and support tickets.

Every new table has RLS and demo rows are labelled where seeded. Admin/sponsor access remains aggregate-only. Photo uploads are canvas-re-encoded, removing EXIF/GPS metadata. No npm dependencies were added.

## Verification

- `npm run lint --workspace web` — passed.
- `npm run typecheck --workspace web` — passed.
- `npm run test --workspace web` — passed, 60 tests.
- `npm run test:db` — passed, 138 tests across 8 files.
- `npm run build --workspace web` — passed.
- `npm run test:e2e --workspace web` — passed, 6 tests.
- Responsive coverage: 320, 390, 768 and 1440px with no horizontal overflow.
- Accessibility: landing, resident Home and admin Township Pulse have no WCAG A/AA violations.
- The local database was reset and reseeded after browser tests, leaving a clean demo state.
- `scripts/seed-demo.ts` now seeds at least one row in every public table, including disputes, moderation reports, booking comments, blocks, audit entries, programme costs, pilot baselines, redemptions, challenge progress, group memberships, notification preferences, item guides, equipment hubs and hub inventory. Re-running the seed is idempotent.

## Changes from the literal specification

- Repository names are retained: `item_categories`, `items.estimated_new_price_rm`, `item_categories.typical_new_price_rm`, `event_rsvps`, and `public.reward_rules` as the single BP amount configuration.
- The existing idempotency key remains `(user_id, action_type, source_type, source_id)` because it is stricter than `(user_id, reason_code, source_id)`.
- Two money metrics are shown: estimated value shared for every completed borrow, and the existing self-reported purchases-avoided metric.
- CO₂e totals remain hidden until every contributing category has both a factor and a cited source, preserving the repository's existing methodology rule.
- Official 2026 school holidays and 2026–2027 public holidays are seeded from Kementerian Pendidikan Malaysia and Jabatan Perdana Menteri PDFs. Every date is marked `needs_review`. No 2027 school-holiday dates were invented because an official 2027 school calendar was not available.
- Demand buckets require five summed search events because `search_events` intentionally has no `user_id`.
- AI support uses the already-installed OpenAI adapter. Unsupported or missing `AI_PROVIDER`/`AI_API_KEY` uses deterministic fallbacks.

## Values still requiring confirmation

- Trust-score weights and the 300 RM high-value threshold.
- Existing and new BP amounts if any should differ from `public.reward_rules`.
- CO₂e factors and citable sources per item category.
- Festival default uplifts, including the ×2.5 hosting/kitchen defaults.
- Official 2027 school-holiday dates when KPM publishes them.
- Every seeded calendar date's `needs_review` status.
- Invite monthly cap, request limit, reliable-returner threshold and chatbot rate limit are currently set to the proposed defaults.
