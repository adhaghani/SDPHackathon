# BorrowBetter Feature Pack v2 — implementation plan

Status: **Complete and verified.** All Phase 1–6 gates, build, responsive, accessibility and end-to-end checks pass. See `feature-pack-v2-final-report.md`.

command from user: proceed all phases without awaiting review. after each phases, please push.

## 1. Repository audit

### 1.1 Actual schema

The migration-backed schema currently contains:

- Township and identity: `townships`, `neighbourhoods`, `facilities`, `profiles`, `township_members`, `audit_log`.
- Events: `event_categories`, `events`, `event_staff`, `event_rsvps`.
- Borrowing: `item_categories`, `items`, `bookings`, `booking_messages`.
- Rewards: `reward_rules`, `points_ledger`, `levels`, `badges`, `user_badges`, `notifications`.
- Community and safety: `partners`, `rewards`, `redemptions`, `challenges`, `challenge_progress`, `announcements`, `help_requests`, `interest_groups`, `group_members`, `disputes`, `reports`, `blocks`, `programme_costs`, `pilot_baselines`.
- Operations: `notification_preferences`, `partner_accounts`, `equipment_hubs`, `hub_inventory`.
- View: `v_member_points`.

Name differences from Feature Pack v2:

| Feature Pack name | Repository name to keep |
| --- | --- |
| `categories` | `item_categories` for Pinjam; `event_categories` for Jom |
| RSVPs | `event_rsvps` |
| `estimated_value_rm` | `items.estimated_new_price_rm` |
| category default value | `item_categories.typical_new_price_rm` |
| `reason_code` in the idempotency key | `points_ledger.action_type` plus existing `source_type` |
| `POINT_RULES` application config | `public.reward_rules` is already the runtime point configuration |

The existing `points_ledger` unique key is:

```text
(user_id, action_type, source_type, source_id)
```

That is more precise than the proposed `(user_id, reason_code, source_id)` and will be retained.

### 1.2 Existing BetterPoints awards

`public.award_points` resolves the most specific active `reward_rules` row, checks daily and weekly caps, takes an advisory transaction lock, inserts into `points_ledger`, and uses `ON CONFLICT DO NOTHING`. Awards are therefore already idempotent for the same user/action/source tuple.

Current default rules:

| Verified action | BP | Existing source |
| --- | ---: | --- |
| Event attendance | 50 | `event_rsvps` |
| Gotong-royong attendance | 100 | category-specific event rule |
| Item lent and return confirmed | 40 | lender / `bookings` |
| Item returned on time | 10 | borrower / `bookings` |
| Event hosted with at least three verified attendees | 100 | host / `events` |
| Help completed | 30, daily cap 2 | `help_requests` |
| Volunteer hours verified | 30, weekly cap 120 | `event_rsvps` |

Awards happen from:

- `check_in`
- `complete_event`
- `verify_volunteer_hours`
- `transition_booking`
- `complete_help_request`
- dispute resolution

The current notification copy is generated from the action type and is not yet a plain verified reason. Feature Pack v2 will add a reason template to `reward_rules` and persist the rendered reason on each ledger row.

### 1.3 Current QR handover

There is no booking handover QR today.

- Event attendance has a short-lived HS256 ticket signed with `jose`, normally 90 seconds or 60 seconds when rotating QR is enabled.
- Booking handover is a two-party state machine: lender approval, lender and borrower `confirm_handover`, borrower `mark_returned`, then lender `confirm_return`.
- `public/sw.js` is install-only. It explicitly does not cache app data.
- Existing QR dependencies are `qrcode.react` and `@yudiel/react-qr-scanner`; no new dependency is required.

### 1.4 Current impact estimate

There is no existing CO₂e or “waste avoided” calculation.

The current estimate is `estimated_purchases_avoided_rm`:

- completed bookings only;
- borrower answered “yes” to “would have bought or rented it”;
- item value is `items.estimated_new_price_rm`, falling back to `item_categories.typical_new_price_rm`;
- always labelled “Estimated”.

`/admin/methodology` currently states that no CO₂e figure is shown without a documented, cited emissions factor. That rule will remain until category factors and their sources are confirmed.

### 1.5 Other relevant current behaviour

- Bookings are date-range based and prevent overlap for `approved` and `handed_over` bookings with a GiST exclusion constraint.
- Bookings already capture `borrower_would_have_bought` and handover/return timestamps.
- `disputes` already exist and are linked to bookings.
- Admin aggregate functions exist for Township Pulse, insights, budget and rewards economy; several suppress buckets under five residents.
- Photo uploads for items, events and rewards already use client-side canvas re-encoding, which removes source EXIF, but the logic is duplicated.
- AI currently has one application module, `apps/web/lib/ai.ts`, used for an admin summary. It supports OpenAI through existing dependencies and falls back deterministically without `AI_API_KEY`.
- The worktree contains uncommitted UI changes in four Community/Report files. Those changes will be preserved unless a later feature genuinely requires touching the same files.

## 2. Conflicts and decisions to confirm

1. **Point configuration name.** The plan uses `public.reward_rules` as the repository’s `POINT_RULES`. A second application-level amount table would create two competing sources of truth.
2. **Money-saved semantics.** The repository currently counts only self-reported avoided purchases. Feature Pack v2 asks for estimated value on every completed borrow. The plan keeps both metrics:
   - `estimated_value_shared_rm`: every completed borrow;
   - `estimated_purchases_avoided_rm`: only “would have bought” answers.
3. **CO₂e factors.** No factors exist and the current methodology forbids unsourced CO₂e. The schema will support nullable category factors and the UI will omit unsupported totals until values and citations are supplied.
4. **Festival dates.** The plan will not invent 2026–2027 Malaysian gazetted dates. Rows will be inserted only from verifiable official sources, with source URL and verification state. If a date cannot be verified, the feature remains empty rather than guessing.
5. **Trust-score weights.** Proposed defaults are listed below and must be reviewed before migration.
6. **AI provider support.** No new provider SDK will be added. The provider abstraction will support the already-installed OpenAI adapter; unsupported `AI_PROVIDER` values use the deterministic fallback.
7. **Design-handoff location.** The repository contains `design-handoff/`, not `docs/design-handoff/`. This plan follows the actual path.
8. **Scheduling.** `pg_cron` extension creation is attempted, but no cron jobs are configured. All new calculations will therefore be lazy or booking-triggered.

## 3. Proposed trust-score defaults

These values are placeholders for review.

- Base score for an active account: 20.
- Completed borrow without a confirmed damage finding: +4 each, maximum +40.
- On-time return: +2 each, maximum +20.
- Six or more months with verified lending or borrowing activity: +10.
- No open dispute and no organiser-confirmed fault: +10.
- Open dispute: freeze pending-dispute contributions until resolution.
- Organiser-confirmed borrower fault for damage: −15 for the resolved booking.
- Repeated organiser-confirmed fault: additional −5 per resolved fault, to a floor of 0.

Tiers remain:

- Building: below 40.
- Trusted: 40–74.
- Highly trusted: 75 or above.

Other placeholders:

- `HIGH_VALUE_THRESHOLD_RM = 300`.
- Reliable-returner badge: 10 consecutive on-time returns.
- Condition contest window: 72 hours.
- Monthly request limit: 3 open requests.
- Invite reward cap: 10 rewarded invites per inviter per calendar month.
- Chatbot rate limit: 20 messages per user per hour.
- Festival default uplift for hosting categories: ×2.5 in the week before a festival.
- Township goal notification thresholds: 25%, 50%, 75%, 100%.

## 4. Migration order and schema plan

All migrations will live in `supabase/migrations/`, enable RLS on every new table, define explicit `SELECT`/write policies or route writes through `SECURITY DEFINER` functions, and update `apps/web/types/database.ts` through `npm run types:gen`.

### Migration A — `20261012020000_feature_pack_v2_foundations.sql`

Phase 1 data foundations.

- Extend `item_categories`:
  - reuse `typical_new_price_rm` as the category default value;
  - add nullable `co2e_kg_per_borrow`;
  - add nullable `co2e_source`;
  - add `kind` (`item` or `skill`).
- Extend `items`:
  - `kind` with default `item`;
  - `value_source` using the repository’s existing price field;
  - `requires_deposit`;
  - `allow_deposit_waiver`;
  - `min_trust_tier`;
  - deposit constraints so a non-required deposit is zero.
- Backfill `requires_deposit` from `deposit_rm > 0`.
- Add `search_events`:
  - no `user_id`;
  - timestamps, township, neighbourhood, normalized term, category, total and available result counts.
- Add indexes by township/date and normalized term/category.
- Add a security-definer `log_borrow_search` function; authenticated users do not get direct insert access.
- Add search normalization helper and Malay synonym map:
  - drill/gerudi;
  - ladder/tangga;
  - table/meja;
  - chair/kerusi;
  - pot/periuk.
- Extend `reward_rules` and `points_ledger` with a verified plain-language reason field.
- Add `POINT_RULE` reference rows for all new action types while preserving existing amounts.
- Seed reference/demo rows with explicit demo labels where applicable.

### Migration B — `20261012030000_trust_value_item_story.sql`

Phase 2 trust, value and item story.

- Add booking condition fields:
  - `return_condition`;
  - `return_condition_reason`;
  - `condition_recorded_by`;
  - `condition_recorded_at`;
  - `condition_contest_ends_at`.
- Reuse `disputes` for condition contests; add a `kind` discriminator and `score_effect_frozen` flag if not already represented safely.
- Add `compute_trust_score(user_id)` returning:
  - score;
  - tier;
  - list of contributing and penalty reasons;
  - pending-dispute status.
- Add `get_incoming_request_trust(user_id)` returning only the tier for request owners.
- Add `record_return_condition` and `contest_return_condition` functions.
- Add `get_item_history(item_id)`:
  - day-level dates only;
  - anonymized public borrower labels;
  - display names only for the owner;
  - listing, borrow, return, guide and milestone events.
- Add `item_guides`:
  - item, author, markdown body up to 1,000 characters;
  - up to three storage paths;
  - optional safety note;
  - timestamps.
- Add owner-only guide mutation functions and an idempotent +5 BP award keyed to the item.
- Add a borrower guide acknowledgement requirement before handover completion when a current guide exists.
- Add trust-tier enforcement to `create_booking`:
  - high-value items require the configured tier;
  - highly trusted borrowers may use an owner-approved deposit waiver;
  - no payment processing is introduced.

### Migration C — `20261012040000_demand_supply.sql`

Phase 3 supply from demand and skills.

- Add `item_requests` and `item_request_offers`.
- Add `item_request_alert_opt_ins` for category alerts.
- Add request status-expiry logic evaluated on read.
- Add security-definer post, offer, accept and cancel functions.
- Enforce three open requests per user.
- Notify same-township category owners and opted-in users without exposing unit labels or home locations.
- Add nullable `request_offer_id` to bookings so the +15 fulfilled-request bonus can be awarded idempotently at completion.
- Add `bundles` and `bundle_items`.
- Add `booking_group_id` to bookings.
- Add `create_bundle_booking` to create all child bookings in one transaction, checking every item’s availability and failing all-or-nothing.
- Extend item/category fields for skills:
  - skill duration;
  - shared-space meeting facility or “arranged by message”;
  - tuition guardian acknowledgement;
  - category hourly rate for estimated money saved.
- Seed skill categories: repairs, tuition, sewing, cooking, tech help.
- Seed demo bundle templates only in the demo seed:
  - Camping kit;
  - Kenduri set.
- Update item and booking functions so item and skill sessions share the same verified completion state machine.

### Migration D — `20261012050000_engagement.sql`

Phase 4 streaks, invites, highlights and carbon goals.

- Add `streak_months`:
  - user, township, calendar month in `Asia/Kuala_Lumpur`;
  - lend and borrow completion flags;
  - unique user/township/month.
- Add `compute_user_streak(user_id)` and milestone evaluation on booking completion.
- Add idempotent milestone awards at 3, 6 and 12 months.
- Add badge definitions for 3-month regular, half-year neighbour and year of sharing.
- Add `invites` with secure codes and inviter ownership.
- Add `profiles.invited_by_user_id`.
- Resolve invite codes during township joining/signup.
- Award +30 BP to both users after the invitee’s first completed borrow from another lender, keyed to the invite.
- Enforce the monthly cap transactionally.
- Add `profiles.show_in_highlights`, default false.
- Add `monthly_highlights` with month, resident, plain reason, approval state, approver and timestamp.
- Add candidate calculation excluding opted-out users, below-Trusted users and users with open disputes.
- Add organiser approval functions and an idempotent +100 BP award keyed to the highlight.
- Add `township_goals` for year and target CO₂e.
- Add aggregate progress function using only categories with confirmed CO₂e factors.
- Evaluate milestone notifications lazily when Home or Impact reads progress.
- Add demo labels and `Estimated`/`Forecast` wording in the UI.

### Migration E — `20261012060000_admin_intelligence.sql`

Phase 5 Township Pulse intelligence.

- Add `calendar_events` for festivals and school holidays:
  - name and type;
  - start/end dates;
  - official source URL;
  - verification status and note.
- Add `festival_uplifts`:
  - festival/category;
  - default uplift;
  - optional observed prior-year uplift;
  - source and verification state.
- Add `demand_gaps` calculation through a `SECURITY DEFINER` aggregate function:
  - 30-day normalized searches;
  - open requests;
  - available items;
  - k = 5 suppression;
  - sorted by demand minus availability.
- Add `predictive_demand` calculation:
  - eight-week category baseline;
  - verified upcoming festival uplift;
  - observed prior-year uplift when available, otherwise verified default;
  - always marked Forecast.
- Add `shared_library_wishlists` and an admin-only add action.
- Extend the existing aggregate CSV export with demand-gap and forecast rows only.
- Update `/admin/methodology` with:
  - estimated value shared;
  - estimated purchases avoided;
  - trust score;
  - demand-gap calculation;
  - forecast formula and limitations;
  - confirmed CO₂e methodology, when available.

### Migration F — `20261012070000_support_reliability.sql`

Phase 6 offline handover and support.

- Add `booking_handover_tokens`:
  - booking, random token ID, issuer, issued/expires timestamps;
  - consumption timestamp;
  - unique token ID.
- Add `issue_booking_handover_token`:
  - owner only;
  - booking must be approved;
  - 30-minute TTL;
  - HMAC-bound to the booking;
  - records the owner’s handover confirmation if that is not already recorded.
- Add `consume_booking_handover_token`:
  - borrower only;
  - verifies signature, type, TTL, booking state and participant relationship;
  - atomically records the borrower confirmation and advances to `handed_over`;
  - rejects consumed or expired tokens and replay attempts.
- Add `help_articles`, `help_conversations`, `help_messages` and `support_tickets`.
- Add Postgres full-text search over help articles.
- Add a fixed read-only function for the current user’s booking statuses.
- Add a security-definer message function that:
  - limits conversations and messages to the current user;
  - enforces 20 messages per rolling hour;
  - retrieves the top three matching articles;
  - returns no other resident’s data.
- Add organiser ticket creation and ticket policies.
- Seed 15–20 help articles with deterministic, non-personal content.

## 5. Application file plan

### Shared foundations

- `apps/web/lib/points.ts`
  - export reason templates and action-type constants;
  - keep `public.reward_rules` as the amount source.
- `apps/web/lib/search-normalize.ts`
  - pure normalizer and synonym map.
- `apps/web/lib/media.ts`
  - shared canvas compression/re-encode used by item, event, reward and guide uploads;
  - guarantees EXIF, including GPS, is not carried into the uploaded blob.
- `apps/web/lib/trust.ts`
  - tier thresholds and display helpers.
- `apps/web/lib/impact.ts`
  - value-shared, purchases-avoided and CO₂e formatting;
  - refuses unsourced CO₂e.
- `apps/web/lib/handover-token.ts`
  - pure token creation/verification helpers.
- `apps/web/lib/offline-queue.ts`
  - IndexedDB queue for handover scans.
- `apps/web/lib/ai/index.ts`
  - provider-agnostic interface and environment gating;
  - replaces the single `apps/web/lib/ai.ts` entry point.
- `apps/web/lib/ai/openai.ts`
  - existing OpenAI adapter.
- `apps/web/lib/ai/privacy.ts`
  - strict removal of names, units, phone numbers and private messages from prompts/results.
- `apps/web/lib/ai/item-suggest.ts`
  - Snap-to-list prompt and structured response validation.
- `apps/web/lib/ai/help-chat.ts`
  - article-grounded help response generation and deterministic fallback.

No new npm dependencies are planned. Existing packages cover AI, JWT/HMAC signing, QR rendering and QR scanning.

### Server Actions

- Extend `apps/web/actions/borrow.ts`:
  - search logging;
  - new item fields;
  - guide mutations;
  - request-board actions;
  - bundle booking;
  - skill sessions.
- Add `apps/web/actions/guides.ts`
- Add `apps/web/actions/requests.ts`
- Add `apps/web/actions/bundles.ts`
- Add `apps/web/actions/handover.ts`
- Add `apps/web/actions/help.ts`
- Add `apps/web/actions/invites.ts`
- Add `apps/web/actions/highlights.ts`
- Extend `apps/web/actions/admin.ts` for goals, calendar events, uplifts and wishlists.

Every action will use existing validation patterns, `requireActiveMember`/role checks, explicit error states and `revalidatePath`.

### Resident screens and components

- Borrow search:
  - normalized search logging;
  - no-results request CTA with prefilled term;
  - bundle and skill filter chips.
- `/borrow/new`:
  - Snap-to-list photo flow;
  - suggested fields marked “Suggested”;
  - explicit confirmation before publishing;
  - non-AI category-default fallback.
- `/borrow/items/[id]`:
  - item history;
  - guides and safety note;
  - trust requirement and deposit-waiver messaging;
  - skill session details;
  - bundle presentation.
- `/borrow/bookings/[id]`:
  - guide acknowledgement;
  - condition rating;
  - offline-capable QR handover;
  - sync status and error recovery.
- Home and `/rewards`:
  - streak and next deadline;
  - neighbour-of-the-month banner;
  - carbon-goal progress;
  - estimated value shared.
- Profile:
  - own trust score and reasons;
  - incoming-request tier display for owners;
  - invite link and QR;
  - highlight opt-in.
- Help:
  - app-shell help entry opens a chat widget;
  - top-three article fallback without AI;
  - AI answers with article links only;
  - “Talk to an organiser” ticket action.

New UI components will include:

- `TrustScorePanel`
- `ItemHistoryTimeline`
- `ItemGuideForm`
- `ItemRequestBoard`
- `BundleCard`
- `SkillFields`
- `SnapToList`
- `StreakPanel`
- `InviteShare`
- `HighlightBanner`
- `CarbonGoalProgress`
- `DemandGapPanel`
- `ForecastCard`
- `HandoverQr`
- `HandoverScanner`
- `OfflineSyncStatus`
- `HelpChat`

### Admin screens

- Township Pulse additions:
  - most wanted, not available;
  - CSV export;
  - add to shared-library wishlist.
- Forecast card with festival source and `Forecast` label.
- Neighbour-of-the-month approval queue.
- Township goal editor.
- Calendar-event verification queue.
- Methodology expansion.

All admin data will come from aggregate `SECURITY DEFINER` functions or approved named-highlight records. Raw resident activity, unit labels, home locations and private messages will not be exposed.

### Service worker

Update `apps/web/public/sw.js` to:

- cache only the handover route shell and static assets needed to render it;
- never cache authenticated booking data or tokens as HTTP responses;
- use a network-first navigation strategy for the handover page with a cached fallback;
- leave IndexedDB sync ownership in the application code;
- respect existing authenticated cookie boundaries.

## 6. Tests

### SQL / pgTAP

Add under `supabase/tests/`:

- `feature_pack_v2_foundations_test.sql`
  - search logging permissions and normalization;
  - RLS on new tables;
  - point-rule lookup and reason rendering.
- `feature_pack_v2_trust_test.sql`
  - trust score and reasons;
  - high-value tier gate;
  - deposit waiver;
  - condition contest freeze;
  - item history privacy.
- `feature_pack_v2_supply_test.sql`
  - request limit and expiry;
  - offer notification targeting;
  - fulfilled-request bonus;
  - all-or-nothing bundle booking;
  - skill session eligibility.
- `feature_pack_v2_engagement_test.sql`
  - streak timezone boundaries;
  - milestone idempotency;
  - invite reward conditions and cap;
  - highlight opt-in and approval;
  - carbon-goal suppression without factors.
- `feature_pack_v2_intelligence_test.sql`
  - k = 5 suppression;
  - demand-gap sorting;
  - festival uplift precedence;
  - forecast output.
- `feature_pack_v2_reliability_test.sql`
  - handover token happy path;
  - wrong participant;
  - expired token;
  - replay;
  - booking-state conflicts;
  - chatbot rate limit and article-only retrieval.

The completion test required by the pack will explicitly complete the same booking twice and assert one lender award, one on-time award and one request bonus.

### Vitest

Add/extend under `apps/web/tests/`:

- search normalizer and synonyms;
- trust tier formatting;
- impact calculations and missing-factor handling;
- provider-agnostic AI fallback and privacy filtering;
- Snap-to-list structured response validation;
- handover token helpers;
- offline queue serialization and retry behaviour;
- Server Action validation/error mapping with mocked Supabase clients;
- help chat article ranking and no-key fallback.

### Browser checks

For every new screen, verify 320, 390, 768 and 1440 px:

- no horizontal overflow;
- visible 2 px focus ring;
- sentence case;
- text contrast on coral/sun/mint/lilac;
- reduced-motion behaviour;
- empty, loading and error states;
- camera-denied/manual-token fallback;
- offline handover shell and reconnect sync.

## 7. Execution phases and review gates

### Phase 1 — foundations

1. Add Migration A.
2. Add shared point-reason, search-normalization and media modules.
3. Wire Borrow search logging and new item fields.
4. Regenerate Supabase types.
5. Add foundation SQL and Vitest coverage.
6. Run:

```bash
npm run lint --workspace web \
  && npm run typecheck --workspace web \
  && npm run test --workspace web \
  && npm run test:db
```

Stop for review.

### Phase 2 — trust, value and item story

1. Add Migration B.
2. Implement trust score, tier enforcement and condition workflow.
3. Add money-saved displays.
4. Add item history and guides.
5. Add tests and responsive states.
6. Run the same lint/typecheck/test gates.

Stop for review.

### Phase 3 — supply grows from demand

1. Add Migration C.
2. Implement request board and fulfilled-request bonus.
3. Implement bundles and atomic booking groups.
4. Implement skill lending.
5. Implement Snap-to-list through `lib/ai` with and without a key.
6. Add tests and responsive states.
7. Run the same gates.

Stop for review.

### Phase 4 — engagement

1. Add Migration D.
2. Implement streaks and milestones.
3. Implement invites.
4. Implement neighbour-of-the-month approval.
5. Implement township carbon goals with factor gating.
6. Add tests and responsive states.
7. Run the same gates.

Stop for review.

### Phase 5 — admin intelligence

1. Add Migration E with only verified calendar sources.
2. Implement demand gaps, CSV export and wishlist action.
3. Implement predictive demand and resident nudges.
4. Update methodology.
5. Add tests and responsive states.
6. Run the same gates.

Stop for review.

### Phase 6 — reliability and support

1. Add Migration F.
2. Implement signed offline handover and IndexedDB sync.
3. Extend the service worker for the handover shell.
4. Implement help articles, chatbot and support tickets.
5. Add offline, AI-key and no-AI-key tests.
6. Run the same gates.

Stop for review.

### Final verification

After all review gates pass:

```bash
npm run lint --workspace web \
  && npm run typecheck --workspace web \
  && npm run test --workspace web \
  && npm run test:db \
  && npm run build --workspace web
```

Then run the full responsive/accessibility/offline checklist and produce the final report required by Feature Pack v2.

## 8. Inputs still needed from review

- Approval or replacement of trust-score weights.
- Confirmation that `public.reward_rules` may remain the single point amount configuration.
- Confirmation of the dual money-saved metrics.
- CO₂e factor values and citable sources, if carbon totals should be visible.
- Official 2026–2027 Malaysian festival and school-holiday sources/dates.
- Confirmation of the 300 RM high-value threshold and the other placeholders in section 3.
- Confirmation that OpenAI-only provider support is sufficient until another provider SDK is approved.
