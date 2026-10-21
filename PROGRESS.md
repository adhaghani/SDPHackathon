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

## Help chatbot — 15 October 2026

- Expanded the knowledge base from 18 to 34 articles, including the full borrowing journey, listing, returns, messages, events, rewards and recycling. Help now supplies up to eight matching guides and the last eight conversation turns to the model.
- Replaced all-keyword matching with ranked keyword matching, boosted article titles, and retained the previous question for short follow-ups. Unmatched searches return no articles instead of unrelated guides.
- Rebuilt `/help` with the existing shadcn message, bubble, message-scroller and input-group components. Includes starter questions, pending feedback, Enter/Shift+Enter controls, new chat, article search and organiser support.
- Added owner-scoped, idempotent assistant-reply persistence and useful article answers when AI is unavailable. Conversation URLs allow replies to survive refresh.
- Validation: 21 targeted Vitest tests, 12 transactional pgTAP assertions, TypeScript, web ESLint and whitespace checks passed. Playwright passed at 390px and 1440px with real MiMo replies, reload persistence, follow-up context and Axe checks scoped to the Help page content.
- Migration `20261016060000_help_chat.sql` was applied and recorded locally. The standard local push command remains blocked because the database records `20261016050000_guest_pass_sharing`, whose source file is absent from this checkout. That unrelated history was preserved. Relevant Help database types were regenerated without importing unrelated schema drift. No cloud migration or deployment was performed.

## Badge progress and details — 15 October 2026

- Badge details now use the existing shadcn Dialog on rewards, profile and the office catalogue. Tap/click and keyboard controls show requirements and earned dates, with Escape dismissal and focus restoration. Cards stay flat and profile badges retain their placement below the resident name.
- Progress and automatic awarding share one database calculation for activity counts, metadata filters, sustained participation, consecutive on-time returns and monthly streaks. Numeric progress is not shown for office-selected awards. Streak BP milestones remain unchanged; configured badge thresholds control badge eligibility.
- The office form loads existing awards and changes their rules only when explicitly selected. Rules are validated in the server action and membership-checked RPC. Monthly highlight selection grants its badge directly only while that badge uses manual selection.
- New awards save the earning-rule snapshot so later edits do not rewrite their explanation. Existing earned badges retain their date and current requirements; original rules are marked unavailable when no historical snapshot exists.
- Validation passed: 10 targeted Vitest tests; 63 pgTAP assertions across badge, trust and engagement suites; TypeScript; web ESLint; diff whitespace checks; and two Playwright scenarios at 390px/1440px covering dialogs, focus restoration, accessibility and office rule preservation.
- Migration `20261016070000_badge_progress_and_rules.sql` was applied and recorded locally, and relevant database types were regenerated. The pre-existing missing guest-pass migration file still blocks the standard local push command. No cloud migration or deployment was performed.

## Superadmin township setup — 15 October 2026

- Added a platform role independent of resident membership and township-manager roles. `/superadmin` provides a searchable township directory, boundary overview, guided creation, manager appointments, and setup activity history.
- Township setup saves validated GeoJSON polygons, state/district, settings and neighbourhoods. Existing neighbourhood IDs are preserved. Boundary drawing supports editing, point undo, deletion and redrawing; coordinate entry provides a keyboard alternative. Overlapping interiors require explicit acknowledgement.
- Added draft/active/archived lifecycle controls. Drafts cannot receive residents; activation requires a manager or successfully sent invitation. Archiving requires confirmation, preserves records and removes normal township entry. Existing historical participant permissions are not retroactively purged.
- Existing verified accounts can be appointed immediately. New manager email links lead to password setup and acceptance. SQL checks verified recipient identity and appointment state; revocation prevents acceptance. The last active manager cannot be removed until a replacement is appointed. Delivery failures remain visible and retryable.
- Added the trusted `npm run superadmin:grant -- owner@example.com` bootstrap command and [operator setup guide](docs/SUPERADMIN.md). The office map uses the saved boundary; illustrative neighbourhood coordinates remain limited to legacy demo townships.
- Recovered `20261016050000_guest_pass_sharing.sql` from the exact statements recorded in local migration history. Standard local migration push now works. Applied the new platform migration locally and regenerated database types. No hosted migration or deployment was performed.
- Validation: production build, workspace lint and TypeScript checks passed; 118 unit tests and 286 transactional database assertions passed. The local browser journey passed real polygon drawing and undo, email-link manager onboarding through the local inbox, activation, access isolation, archive confirmation and manager access loss. Boundary-editor Axe checks passed at 390px and desktop widths. Local browser fixtures were removed afterward.
- Stabilized the existing offline-handover database test to reference its own booking fixture rather than matching multiple local bookings. No demo reset was needed.

## Branded HTML email — 15 October 2026

- Added a shared email source in `emails/borrowlah.ts` and 13 generated standalone HTML templates for the six Supabase Auth messages and seven optional account-security notices. The design uses BorrowLah's paper/ink/lime/orange palette, wordmark, rounded actions, 3R footer, responsive tables and inline styles. No external images or font downloads are required.
- Manager invitations use tailored confirmation, magic-link and invite content based on the message's redirect URL. Confirmation URLs, fallback links, verification codes and server-side HTML escaping remain owned by Supabase Auth. Existing security notification enablement defaults remain unchanged.
- Configured the local Auth templates and BorrowLah sender name. Restarted local Supabase with backup preservation; no database reset or demo reseed was used. Resend is not required. There is no application notification email sender currently wired to the optional Resend environment variables.
- Added template build/check/preview commands, a hosted Management API configuration export, and [email setup documentation](docs/EMAILS.md). Hosted Auth templates require a separate installation; no cloud changes were made.
- Verified actual local delivery for magic links, manager invitations, Auth admin invitations, registration confirmations, recovery, email changes and reauthentication codes. Six template unit tests, generated-output checks, workspace lint and TypeScript checks passed. All 14 visual variants passed browser overflow and Axe checks at 320px and 720px.
- The full local platform browser journey passed with the redesigned email, including manager password setup, acceptance, activation and archive access checks. A local Docker interruption during verification required restoring the runtime and removing an interrupted test fixture; only regenerable build caches were cleared. Browser assertions now target their own township and wait for wizard step transitions.

## Image uploads and display — 16 October 2026

- Corrected borrow, event, giveaway and sponsor upload paths to use the folders accepted by the existing storage policy. Guide and recycling paths were already valid; no bucket permissions were widened.
- Display already-compressed uploaded images directly in shared posters, feed cards, giveaway cards and item details, avoiding the unconfigured remote image optimiser. Saved guide photos now render with uncropped thumbnails and full-image links. Reward cards now render their saved sponsor image instead of ignoring it.
- Added upload progress and disabled save controls during uploads. Failed replacements preserve the previous saved image. Removed raw file fields from server-action submissions; the forms submit the uploaded URL.
- Verification: production build, TypeScript, workspace lint and all 124 unit tests passed. Five production Playwright scenarios cover all six upload surfaces, saved images after reload, actual image decoding, PNG/JPEG/WebP inputs and a rejected replacement upload. Guide and reward layouts were visually reviewed at desktop and 390px widths.
- Existing campaign-dependent recycling scenarios could not pass against the current local data because no active campaign progress widget is available. The independent recycling photo upload/save/reload/decoding scenario passed. No demo reset, hosted migration or deployment was performed.


## Load-time improvements — 18 October 2026

- Parallelised catalogue and session/shell reads; Home now streams optional sections independently and avoids unused feed rows and separate event count requests.
- Added credential-scoped reference-data caching with immediate badge invalidation, responsive public Storage images, deferred maps, intent-based route prefetching and batched realtime refreshes. Private and transactional data remain fresh.
- Reused session points, moved Rewards totals into a caller-scoped aggregate RPC and added 20-record history pagination with a batched incoming-trust RPC. Applied the additive migration locally and regenerated types without resetting data. No hosted migration or deployment was performed.
- Validation: production build, TypeScript and ESLint passed; all 168 app tests and 309 database assertions passed. Desktop/mobile browser checks passed for the five affected pages. See [performance notes](docs/PERFORMANCE.md) for implementation, local before/after measurements, limitations and rollout order.

## 3R pitch presentation - 19 October 2026

- Added the public `/brief` recording companion with 12 manually advanced scenes following the five-member planet-first script: introduction, Reduce, Reuse, Recycle, recognition, proposed pilot and closing.
- Reused the connected-homes logo, township garden, pressure-washer asset, existing typefaces and lime/ink/paper palette. No new dependencies or database writes.
- Added scene selection, previous/next controls, replay, keyboard shortcuts, browser fullscreen, clean recording mode, narration cues and separate links to actual app workflows. Scene URLs preserve the selected scene and clean mode; search indexing is disabled.
- Clean mode keeps a 16:9 composition with cursor/controls hidden. Editor preview stacks on phones; reduced-motion preferences remove entrance animations. Capture guidance is in `docs/BRIEF.md`.
- Verification: workspace lint and TypeScript passed; production build passed. Browser checks covered all 12 scenes, navigation/replay, clean mode, URL/reload persistence, double-click recovery, fullscreen, first/last boundaries, reduced motion, invalid-scene fallback and noindex metadata. Desktop and phone previews and all recording scenes were visually inspected. No resident data, database fixtures or hosted deployment were changed.
- Replaced the Reduce scene's SVG mock with an AI-edited version of the owner's supplied Kärcher photograph, isolated on transparency with leaf/reuse-arrow accents. Preserved the original photo and saved the generation prompt. Updated presentation image decoding, desktop clean-mode and 390px preview checks passed; final build, lint and TypeScript passed.

## Mouse-led pitch scenes - 19 October 2026

- Made the three-R principles, borrowing steps, giveaway roles, recycling materials and proposed pilot measures selectable. Each click highlights the selection and reveals a short explanation on the same scene, including in clean recording mode.
- Kept the cursor visible for pointer-led recordings. Replay resets scene interactions. Double-clicking an interactive button no longer restores editor controls; empty-stage double-click recovery remains available. No simulated transaction writes or environmental totals were introduced.
- Production browser checks passed all five interaction types, selected-state semantics, replay/reset, double-click behavior, Enter activation, 390px layout and reduced motion. Desktop recording frames and the phone preview were visually reviewed. Workspace lint, typecheck and production build passed.

## Everyday scenarios and transition cues - 19 October 2026

- Kept the opening scene first and added a second, clickable three-scenario scene with the owner's edited pressure-washer photo and generated chair/bottle cutouts. The presentation now contains 13 scenes; existing scene URLs remain stable.
- Added an editor-only transition strip to every scene with a verbatim script line and the next scene's title. The opening cues the start of Member 1; the final scene instructs a closing hold. Guidance is hidden in clean recording mode.
- Fixed image overlap by using positioned fixed-height image frames and contained fill images. Reduced the editor preview height so desktop transition guidance remains visible.
- Verification passed: lint, TypeScript/production build, cues and next labels on all 13 scenes, scenario selection/replay, clean-mode cue removal, image decoding and no caption overlap at 1440px, 1920px and 390px. Desktop recording and phone layouts were visually checked. Asset prompts are recorded in `docs/brief-assets/scenario-images.prompts.txt`.

## 2026-10-19 — Script-led brief refinement
- Re-read all five recorded-script sections and checked all 13 transition quotes against the source script.
- Repeated the washer, chair and bottles through Reduce, Reuse, estimate explanation and closing; added click-controlled object responses.
- Added a labelled two-confirmation giveaway illustration: the chair moves only after both confirmations. No application transactions or data writes.
- Added Count items / Custom kg explanation and the script's documented-factor condition for carbon and energy equivalents.
- Updated editor capture notes; enlarged affected mobile previews to avoid clipping and bottom-motif collisions.
- Validation: lint, typecheck, production build and diff whitespace checks passed. Browser checks covered changed scenes at 390px and 1440px, with final mobile and 1920x1080 clean-mode captures; verified both confirmations, estimate switching, keyboard activation, replay reset, reduced motion and hidden recording cues. No full E2E suite or deployment.

## 2026-10-20 — Full script coverage and keyboard presentation
- Read the supplied `borrowlah-3r-pitch-team-pack (1).pdf`, including all five spoken sections. Rebuilt `/brief` as 26 slides / 73 reversible visual beats, including the opening hold. Concatenated narration matches PDF pages 2–6 word for word.
- Added the missing visual stages for item availability/dates, loan return/completion, borrowing aims/pilot evidence, giveaway condition/location/reservation, estimate methods/material breakdown, factor-supported equivalents, estimate limits, participation, pilot measures, feedback and staff effort.
- Centralised beat state: Right/Page Down and Left/Page Up drive every interaction and cross-slide transition. Clicks use the same state. URLs preserve one-based beat numbers. Added restart, slide-jump and boundary handling. Recording mode hides cursor and editor cues; entering it restores the frame to the top.
- Added generated transparent tool, books/plant and paper/cans groups for visual variety. Kept the named opening objects and consistent pressure-washer loan example. Saved images in public/images/brief and prompts/provenance in docs/brief-assets/variety-images.prompts.txt.
- Added docs/BRIEF_SCRIPT_MAP.md and refreshed docs/BRIEF.md with narration and recording controls.
- Validation: lint, typecheck and production build passed. Browser traversal verified all 73 beats forward and back, with no page errors. All 26 slides were checked at 1440px and 390px for overflow/clipping. Final checks passed URL reload, reverse interaction, click/key state parity, cursor/cue hiding, restart, slide jump, fallback and both motion preferences.
- Fixed-frame check completed across heights 700/1000: desktop editor 1376×774, clean 1440×810; mobile editor 366×660, clean 390×219.375, consistent across tested slides. No database writes, full E2E run or deployment.

## 2026-10-20 — Actual mobile app UI inside the pitch
- Added real mobile screenshots to slides 6 (find/check/request), 10 (giveaway listing/condition/shared location) and 15 (recycling Count items/Custom kg). Reused the app's existing routes and components, with illustrated product assets and labelled sample data; no redrawn form UI.
- Added a slide-only phone frame and adjacent step controls. The existing narration beat controls the captured screen, including reverse navigation, Page keys, click selection and URL restoration. All current-slide captures load eagerly. Script, slide/beat count and editor controls are unchanged.
- Recorded capture sources and sample-content substitutions in docs/brief-assets/app-ui-captures.md. Borrowing shows dates selected and a request ready to send; giveaway forms and recycling inputs remain unsaved. No transaction, upload or publication was submitted.
- Validation: production build/TypeScript, project lint command and diff whitespace checks passed. Browser checks covered all eight captured states at 1440px, 390px and 1920×1080 recording mode; no broken images, clipping or page errors. Confirmed keyboard reverse, Page Down, click parity, URL beat restoration, cursor hiding and normal/reduced motion. Frame sizes remained constant across heights 700/1000. No full E2E suite or deployment.

## 2026-10-20 — Full-width presenter workspace and summary arrow
- Removed the presentation/editor width caps. Desktop `/brief` now uses a viewport-height 70% slide / 30% presenter-script layout. Narration, transition cues, navigation and guidance are in an independently scrolling right panel. At widths up to 900px, the panel stacks below the full-width slide. Clean recording mode expands the slide to the full viewport width.
- Preserved width-based 16:9 geometry, keyboard/beat state and script content. Short viewports scroll within the slide pane rather than shrinking the slide.
- Fixed the everyday-scenarios summary arrow: its generic card grid had overridden the summary's flex layout. Increased selector specificity and grouped the text so the arrow stays inline, centred next to the phrase.
- Validation: production build/TypeScript, project lint and whitespace checks passed. Browser checks passed the 70/30 proportions at 1024, 1440, 1920 and 2560px; checked the 390px stacked layout and all 26 slides at desktop/mobile for content bounds. Summary arrow stayed vertically centred beside its text at all five widths. Confirmed fixed geometry across short/tall viewports, full-width clean mode, panel restoration, reverse/Page-key navigation and no page errors.

## Judges preview — 21 October 2026

- [x] New project overview, four role entry points, and before-demo notes.
- [x] Browser-only seeded resident, manager, guard, and event organiser views, including cross-role event RSVP/check-in.
- [x] Six-step borrowing, sample membership review, visitor arrival/departure, search/filter/save, recycling and reward simulations.
- [x] Persistent seeded/no-database labels, unavailable-action toasts, reset, and API/server-action blocking before Supabase client construction.
- [x] Preview flag scoped to judges-preview in Vercel; judges.borrowlah.my assigned to that branch, verified DNS.
- [x] Build, lint, typecheck, diff check, 194 unit tests; 18 browser interaction checks without Supabase requests or page errors.
- [x] All five pages: no document overflow at 320/390/768/1440; zero automated axe WCAG A/AA violations; desktop/mobile visual review passed.
- [x] Public deployed branch domain verified: all five pages return 200 without sign-in; 18 live browser checks pass; API/POST routes return 403; production remains unchanged.

Instructions and demonstration sequence: [JUDGES_PREVIEW.md](docs/JUDGES_PREVIEW.md).
