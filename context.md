# BorrowLah — Simplified System Context

> Last updated: **14 October 2026**.
>
> This file is a handoff context for an AI Design or implementation partner. It describes the current product, routes, navigation, recycling feature, visual system, data model, feature flags and known verification state.
>
> The working tree currently contains **uncommitted recycling, navigation and documentation changes**. Treat the source files listed in section 18 as authoritative if this summary and the code disagree.

---

## 1. Product in one paragraph

BorrowLah is a demo-ready community participation and sustainability system for Malaysian townships. Residents borrow and lend useful items, give away household goods, join neighbourhood events, help neighbours, manage guest access and log self-reported recycling. Verified real-world activity earns **BetterPoints (BP)**.

Township admins see aggregate participation and planning signals, not private resident activity. Sponsor partners can create rewards and challenges.

The core promise is:

> **Share more. Connect more. Live better.**

The product is intentionally practical, local and trust-oriented. It should feel welcoming to residents, useful to organisers, accountable to township offices and transparent to sponsors.

---

## 2. Product principles

1. **Real-world actions matter.** Points come from verified activity or explicitly labelled self-reported estimates, never merely from opening the app.
2. **Privacy by default.** Private messages, unit labels, exact addresses and resident-level activity are not exposed to admins or sponsors.
3. **Shared spaces first.** Locations should be neighbourhoods, facilities or public meetup points, never private home addresses.
4. **Progress is visible.** Residents should understand what they can do next and what they have earned.
5. **Demo honesty.** All seeded residents, events, partners, rewards and metrics are fictional/sample data. Impact figures must stay labelled as estimates.
6. **The township line is the signature motif.** The route/line metaphor connects Pinjam, Jom, Tolong and Rimba.

---

## 3. Main audiences

### Residents
- Discover, request, save and lend items.
- Create borrow bundles and item requests.
- Give away household items.
- Join events and register as attendee or volunteer.
- Ask for or offer practical help.
- Manage guest passes.
- Log recycling estimates and view personal impact.
- Track BetterPoints, levels, badges and vouchers.
- Manage comfort preferences, language and profile visibility.

### Organisers / event staff
- Create and manage events.
- Open QR/manual check-in.
- Verify volunteer hours.
- Complete an event after enough verified attendance.

### Township admins
- Review aggregate participation through Township Pulse.
- Manage members, moderation, disputes, support, guest access and programme costs.
- Review demand, engagement and planning signals.
- Manage recycling campaigns and cited impact factors.
- Manage the awards and rewards catalogue.
- Inspect methodology and privacy safeguards.

### Sponsor partners
- Create sponsor-funded rewards.
- Create community challenges.
- View aggregate redemption/challenge statistics.
- Never see resident-level private activity.

---

## 4. Current route map

### Public / onboarding
- `/` — landing page and demo role switcher.
- `/sign-in`
- `/sign-up`
- `/onboarding`
- `/auth/callback`
- `/guard` — guard-facing guest-pass operations.
- `/pass/[token]` — shared guest-pass token view.

### Resident app
- `/home` — greeting, quick actions, to-dos, nearby events, items to borrow, recycling impact and recent activity.
- `/borrow` — searchable/filterable item catalogue.
- `/borrow/new` — list an item.
- `/borrow/items/[id]` — item detail and booking request.
- `/borrow/bookings/[id]` — booking flow, chat and two-sided confirmation.
- `/borrow/mine` — borrowing, lending and own items.
- `/borrow/saved` — saved items.
- `/borrow/requests` — resident item requests and offers.
- `/borrow/bundles/new` — create a borrow bundle.
- `/borrow/bundles/[id]` — manage a borrow bundle.
- `/giveaway` — household giveaway catalogue.
- `/giveaway/new` — list a giveaway.
- `/giveaway/mine` — resident's giveaways.
- `/events` — event catalogue, meetup map and pagination.
- `/events/new` — host an event.
- `/events/[id]` — event detail, poster, meetup map and RSVP.
- `/events/[id]/ticket` — QR ticket.
- `/events/[id]/manage` — check-in desk and event map.
- `/events/mine` — registered and hosted events.
- `/community` — announcements, help requests and interest groups.
- `/help` — help/chat support.
- `/guests` — create and manage visitor passes.
- `/guests/[id]` — guest-pass details and status.
- `/challenges`
- `/recycling` — today-only recycling composer, lifetime impact, material breakdown and township campaign goal.
- `/rewards` — BP balance, levels, badges, reward catalogue and vouchers.
- `/rewards/activity` — full paginated activity history.
- `/notifications`
- `/profile`
- `/profile/settings`
- `/offline/handover` — offline handover sync helper.

### Admin app
- `/admin` — Township Pulse dashboard.
- `/admin/insights` — aggregate participation insights.
- `/admin/demand` — demand intelligence and item requests.
- `/admin/engagement` — highlights, goals, trust signals, recycling campaigns and impact factors.
- `/admin/map` — neighbourhood map, behind the Leaflet flag.
- `/admin/hubs` — equipment hubs, behind the hubs flag.
- `/admin/members`
- `/admin/moderation`
- `/admin/support`
- `/admin/disputes`
- `/admin/budget`
- `/admin/rewards`
- `/admin/badges` — add/update awards.
- `/admin/methodology` — metric definitions, limitations and recycling factor sources.
- `/admin/guests` — guest access controls.
- `/ai` — AI summary, behind the AI-search flag.

### Sponsor app
- `/sponsor/portal`

### Important route handlers / API routes
- `/api/health`
- `/api/onboarding/join`
- `/api/events/[id]/check-in`
- `/api/events/[id]/ticket`
- `/api/profile/export`
- `/rewards/impact-report`
- `/admin/export`

---

## 5. Navigation behavior

### Mobile
- A fixed **five-tab** primary bar remains at the bottom:
  - Home / Block
  - Borrow
  - Recycle
  - Events
  - Impact
- The active tab uses a lime background with stronger icon weight.
- Safe-area padding is included.
- A fixed circular menu button sits at the top right.
- The menu opens a full-height dark drawer with:
  - BetterPoints
  - notification count
  - all resident or admin routes
  - profile and sign-out controls
- The drawer closes on route change, Escape or backdrop click.
- Giveaway, guest passes, help, saved items, requests, settings and other secondary routes live in the drawer rather than the five-tab bar.
- The notification bell uses a compact circular count badge; counts above 99 display as `99+`.
- On item and booking detail screens, the bottom tab bar may be hidden to make room for the action dock.

### Tablet / desktop
- A floating dark sidebar sits on the left.
- Primary resident routes appear first; secondary routes appear in a scrollable “More” section.
- Admin routes replace the resident secondary list when the user is inside `/admin`.
- Active navigation uses the same lime treatment.
- BetterPoints and notifications appear at the top of the sidebar.
- Profile is anchored at the bottom.
- Content uses the available width rather than a fixed central container.

---

## 6. Current recycling system

The newest major feature is a resident recycling estimator with a township campaign goal.

### Resident flow
- `/recycling` loads:
  - active recycling materials and count units
  - lifetime and monthly estimated kilograms
  - estimated CO₂e avoided
  - estimated kWh saved
  - material breakdown
  - recent logs
  - active township campaign progress
- The composer is a popup dialog.
- Residents can use either:
  - **Count estimates** — enter item quantities and see approximate kg per unit.
  - **Custom kilograms** — enter estimated weight per material.
- Only the current date in `Asia/Kuala_Lumpur` is accepted.
- Logs are private to the resident and capped at 100 kg per resident per day.
- Optional photos are limited to three, compressed/processed in the browser and stripped of EXIF/GPS metadata before upload.
- Uploaded photos use the public `item-photos` storage bucket under the `recycling/` path prefix.
- Photos support context but are not treated as independent verification.

### Impact rules
- Count estimates are converted to kilograms on the server using `recycling_units.kg_per_unit`.
- CO₂e and energy values are calculated from cited material factors.
- The UI hides an estimate when any contributing material lacks a factor/source.
- Energy is displayed as **kWh**, not watts.
- Recycling values must always be described as self-reported estimates.
- Launch factors cite the US EPA Waste Reduction Model v16 documentation/workbook and use documented unit conversions.

### Township campaign
- Admins create or update one active campaign in `/admin/engagement`.
- Campaign fields include title, start date, end date and aggregate kg target.
- Residents see aggregate campaign progress and their contributor eligibility.
- When the target is first reached, active campaign contributors receive an idempotent **50 BP** `recycling_goal_completed` award.
- Completed campaigns become locked.
- The resident Home page shows a compact recycling summary and campaign nudge.

### Important recycling source files
- `apps/web/app/(app)/recycling/page.tsx`
- `apps/web/components/recycling/log-form.tsx`
- `apps/web/components/recycling/impact-summary.tsx`
- `apps/web/components/recycling/turtle-goal-card.tsx`
- `apps/web/components/admin/recycling-forms.tsx`
- `apps/web/actions/recycling.ts`
- `apps/web/lib/recycling.ts`
- `apps/web/lib/validation/recycling.ts`
- `supabase/migrations/20261015010000_recycling.sql`
- `supabase/migrations/20261016000000_recycling_photos.sql`
- `supabase/migrations/20261016010000_recycling_storage.sql`

---

## 7. Feature flags and optional capabilities

Flags are read through `apps/web/lib/env.ts`.

- `NEXT_PUBLIC_DEMO_MODE=true` exposes all implemented stretch features unless a flag is explicitly set to `false`.
- `NEXT_PUBLIC_ENABLE_RECOMMENDATIONS`
- `NEXT_PUBLIC_ENABLE_ROTATING_QR`
- `NEXT_PUBLIC_ENABLE_SPONSOR_PORTAL`
- `NEXT_PUBLIC_ENABLE_AI_SEARCH`
- `NEXT_PUBLIC_ENABLE_EQUIPMENT_HUBS`
- `NEXT_PUBLIC_ENABLE_MULTI_TOWNSHIP`
- `NEXT_PUBLIC_ENABLE_BM_UI`
- `NEXT_PUBLIC_ENABLE_LEAFLET`
- `NEXT_PUBLIC_ENABLE_REALTIME`

Optional AI integration uses `AI_API_KEY`; deterministic/fallback behaviour must still work without it.

---

## 8. Visual system

The current implementation palette is defined in:

`packages/ui/src/styles/globals.css`

Use those tokens as the source of truth. Older palette examples in design documents may no longer match the implementation.

### Core light palette
- Lime: `#D9F45A`
- Ink: `#111111`
- Raised ink: `#2A2A2A`
- Ink soft: `#3A3A3A`
- Paper: `#F4F4EE`
- On-dark muted: `#D4D4CC`
- Hairline: `#E4E4DC`
- Lime track: `#C2DC4A`
- Sky: `#8FD3FF`
- Mustard: `#F2B33D`
- Tomato: `#FF5A36`
- Tomato tint: `#FFE2DC`

Compatibility aliases map older names to the current system:
- `mint` → lime
- `lilac` → sky
- `sun` → mustard
- `coral` → tomato

### Semantic roles
- **Lime** = active navigation, primary emphasis, BetterPoints and the strongest brand highlight.
- **Ink** = primary text and dark navigation surfaces.
- **Sky** = borrow-related emphasis and soft highlights.
- **Mustard** = help-related emphasis.
- **Tomato** = attention, destructive states and high-salience actions.
- **Paper / white** = page and card surfaces.
- Dark theme remaps these tokens rather than introducing a generic blue SaaS palette.

### Typography
- Display face: **Bricolage Grotesque**.
- Body/UI face: **Instrument Sans**.
- Headings are bold and compact.
- Body copy remains readable at mobile sizes.
- Metrics, BP values and counts should use tabular numerals.
- Letter spacing is generally neutral; do not introduce editorial all-caps styling as the default voice.

### Shape and spacing
- Page bands use a large bottom/sheet radius.
- Cards commonly use a 20–22px radius.
- Mobile docks use a 26px radius.
- Buttons are typically pill-shaped.
- Borders are preferred over heavy shadows; shadows are reserved for docks, overlays and elevated controls.
- Interactive cards and controls should provide hover/focus feedback without excessive motion.
- Motion must respect `prefers-reduced-motion`.

### Current navigation treatment
- Navigation surfaces are dark ink.
- Active items use lime with ink text.
- BetterPoints use lime.
- Profile initials use a sky circle.

---

## 9. Shared components and patterns

Use existing components before creating new ones.

### Navigation and shell
- `apps/web/components/navigation/sidebar.tsx`
- `apps/web/components/navigation/mobile-navigation.tsx`
- `apps/web/components/navigation/tab-bar.tsx`
- `apps/web/content/navigation.ts`
- `apps/web/components/navigation/notification-bell.tsx`
- `apps/web/components/shared/better-points-chip.tsx`

### Shared UI
- `apps/web/components/shared/media-poster.tsx`
- `apps/web/components/shared/page-band.tsx`
- `apps/web/components/shared/page-surface.tsx`
- `apps/web/components/shared/pagination.tsx`
- `apps/web/components/shared/status-page.tsx`
- `apps/web/components/shared/status-pill.tsx`
- `apps/web/components/shared/section-heading.tsx`
- `apps/web/components/shared/township-line.tsx`
- `apps/web/components/shared/realtime-refresh.tsx`

### Reusable business patterns
- Status pills for state.
- Pagination for long catalogues.
- Page bands for page identity and back navigation.
- Township-line visuals for meaningful progress, not decoration on every card.
- Dark editorial status pages for 404/error states.
- Poster media with embedded labels and contrast treatment.

---

## 10. Media and poster rules

### Items
- Borrow listings use responsive poster images.
- Seeded items use themed demo SVGs under `apps/web/public/demo/`.
- User-created items can upload compressed WebP/JPEG/PNG images.
- Fallback remains the demo illustration when storage is unavailable.

### Events
- Event cards and details use responsive posters.
- Event title/category/date/location may be embedded over a dark gradient for contrast.
- Event creation supports an optional cover upload.
- `events.cover_path` stores the image path.
- Seeded events fall back to the demo event placeholder.

### Giveaways and guides
- Giveaway and guide flows use the shared `item-photos` upload conventions where applicable.

### Rewards
- Reward catalogue cards use a consistent image area.
- Cards stretch to equal height in each grid row.
- Redeem buttons are pinned to the bottom with `mt-auto`.
- Reward images are optional and stored in `rewards.image_path`.
- Reward kinds map to themed fallback posters.

### Recycling photos
- Maximum three photos per log.
- EXIF/GPS metadata is stripped before upload.
- The `recycling/` path namespace is used.
- Photos are supplementary context, not proof of weight or material quality.

### Storage
- `supabase/config.toml` defines the public `item-photos` bucket.
- Local limit: 10 MiB.
- Allowed MIME types: PNG, JPEG and WebP.
- `supabase/migrations/20261016010000_recycling_storage.sql` also provisions bucket policies for local/remote consistency.

---

## 11. Maps

Map primitives live in:

`packages/ui/src/components/map.tsx`

App wrappers live in:

- `apps/web/components/map/event-map.tsx`
- `apps/web/components/map/lazy-event-map.tsx`
- `apps/web/components/map/neighbourhood-map.tsx`
- `apps/web/components/map/lazy-neighbourhood-map.tsx`
- `apps/web/components/map/geo.ts`

### Current usage
- `/events` and event detail/manage views can show meetup maps.
- `/admin/map` shows an approximate neighbourhood-level map when Leaflet is enabled.
- Maps use Leaflet and OpenStreetMap tiles.
- The map is lazy-loaded on the client.

### Current coordinate limitation
- The database does not yet store real latitude/longitude for events, facilities or neighbourhoods.
- `apps/web/components/map/geo.ts` supplies approximate deterministic demo coordinates.
- Never replace this with private resident addresses.
- Real coordinates should only be added through an explicit privacy-reviewed data-model change.

---

## 12. Data and backend model

### Stack
- Next.js 16 App Router.
- React 19.
- Supabase Auth, Postgres, Storage and optional Realtime.
- Server Components and Server Actions.
- Zod validation.
- Tailwind CSS and shared shadcn/Base UI components in `packages/ui`.
- Leaflet/React Leaflet for optional maps.
- AI SDK only for optional provider-gated AI features.

### Representative tables

#### Identity and township
- `townships`
- `neighbourhoods`
- `facilities`
- `profiles`
- `township_members`
- `invites`
- `audit_log`

#### Events
- `event_categories`
- `events`
- `event_staff`
- `event_rsvps`
- `calendar_events`
- `booking_handover_tokens` is shared infrastructure for rotating QR/handover workflows.

#### Borrowing and sharing
- `item_categories`
- `items`
- `item_guides`
- `item_requests`
- `item_request_offers`
- `item_request_alert_opt_ins`
- `bundles`
- `bundle_items`
- `bookings`
- `booking_groups`
- `booking_messages`

#### Community and trust
- `announcements`
- `help_requests`
- `interest_groups`
- `group_members`
- `reports`
- `blocks`
- `help_articles`
- `help_conversations`
- `help_messages`
- `support_tickets`

#### Giveaways and guest access
- `giveaways`
- `visitor_passes`
- `visitor_logs`
- `walk_in_requests`
- `gates`
- `guest_access_attempts`

#### Impact and engagement
- `township_goals`
- `monthly_highlights`
- `festival_uplifts`
- `shared_library_wishlists`
- `search_events`
- `programme_costs`
- `pilot_baselines`
- `recycling_materials`
- `recycling_units`
- `recycling_logs`
- `recycling_log_items`
- `recycling_campaigns`

#### Gamification and sponsors
- `reward_rules`
- `points_ledger`
- `v_member_points`
- `levels`
- `badges`
- `user_badges`
- `challenges`
- `challenge_progress`
- `partners`
- `partner_accounts`
- `rewards`
- `redemptions`
- `streak_months`

#### Equipment hubs
- `equipment_hubs`
- `hub_inventory`

### Important integrity rules
- RLS is enabled across resident data.
- Integrity-critical writes use `SECURITY DEFINER` Postgres functions.
- Server actions validate inputs and authenticate the user.
- Service-role access is limited to server-only seeding, demo reset and cron/admin work.
- Booking transitions use two-sided confirmation.
- Points are recorded in `points_ledger`, not calculated only in the UI.
- Badge evaluation and campaign reward issuance run through database logic.
- Resident recycling writes go through `log_recycling`; the database enforces date, material, unit, daily-limit and campaign rules.

### Points and recycling flow
- Verified event check-in, completed lending, help, challenge or recycling-campaign completion can append a points-ledger row.
- Residents should see what generated a reward through the activity label.
- `points_ledger` is append-only for authenticated users; corrections use reversal rows and audit history.
- Recycling impact is estimated on read from logged kilograms and material factors.

---

## 13. Privacy and safety constraints

1. Admin dashboards must remain aggregate-first.
2. Suppress small groups where required by the methodology.
3. Never expose private unit labels, exact home addresses or private resident activity.
4. Guest passes expose only the fields needed by the relevant resident/guard workflow.
5. Public storage paths are acceptable for the current demo, but upload copy should not imply photos are verified evidence.
6. Recycling estimates are self-reported and may differ from a scale.
7. CO₂e and kWh values require documented, cited factors.
8. AI outputs must stay within supplied app/help content and must not invent people, locations or account data.
9. Sample data and estimated impact figures must stay visibly labelled.
10. Do not add new infrastructure beyond Next.js and Supabase.

---

## 14. Sample data and demo mode

The seed script is:

`scripts/seed-demo.ts`

It creates fictional demo users and data for:
- Harmoni Heights and a second township.
- Neighbourhoods and facilities.
- Events, RSVPs and check-ins.
- Items, bookings and handovers.
- Giveaways, guest passes and help/community activity.
- Points, levels and badges.
- Partner rewards and challenges.
- An active “October recycling goal” campaign.
- Other admin insight and engagement data.

Useful commands:
- `npm run seed`
- `npm run demo:reset`
- `npm run db:push`
- `npm run types:gen`

Do not present demo names, metrics or estimated impact as real-world claims.

---

## 15. Current implementation state

The product is substantially implemented beyond the original core loop. Current highlights include:
- Full resident borrow/events/rewards/community loop.
- Giveaways.
- Guest passes and guard operations.
- Admin demand, engagement, support, trust and planning views.
- Sponsor portal.
- Optional rotating QR.
- Optional AI search/summaries.
- Optional equipment hubs.
- Optional multi-township switching.
- Optional Bahasa Malaysia UI copy.
- Optional Leaflet maps.
- Offline handover sync support.
- PWA install support.
- Recycling estimates, photos, impact factors and township goals.

`PROGRESS.md` is the live checklist and verification log.

---

## 16. Verification state

As of 14 October 2026, local work reports:
- Lint: pass.
- Typecheck: pass.
- Unit tests: pass.
- Build: pass.
- Database tests: pass, including recycling persistence and photo-path validation.
- Targeted recycling, navigation, responsive and accessibility Playwright suites: pass.

Known caveat:
- The full Playwright suite is **not fully green**. `booking-flow` and sign-out auth failures reproduce independently and are recorded as outside the recycling/navigation scope.
- Cloud preview remains pending.
- Do not claim that every E2E test passes without rerunning the suite.

### Recommended verification commands
```bash
npm run lint --workspace web
npm run typecheck --workspace web
npm run test --workspace web
npm run test:db
npm run build --workspace web
npm run test:e2e
```

For UI changes, also check:
- 320px and 390px mobile widths.
- 768px tablet width.
- 1440px desktop width.
- No horizontal overflow.
- Keyboard focus visibility.
- Drawer/dialog focus and Escape behavior.
- Empty/loading/error states.
- Reduced motion behavior.
- Bottom-tab and action-dock collisions.

---

## 17. Design constraints for an AI Design partner

1. Preserve the current lime/ink/paper identity unless explicitly asked to redesign the brand.
2. Keep the township-line metaphor as the identity anchor.
3. Do not make every card look identical; use hierarchy, rows and whitespace.
4. Keep controls familiar, labelled and keyboard-accessible.
5. Mobile must remain usable at 320–390px.
6. Desktop/tablet should use available width, with readable text measures where content becomes long.
7. Posters must not crop labels or faces.
8. Buttons should have clear action names and stable dimensions.
9. Loading, empty, error and permission states should live in the interface, not rely only on alerts.
10. Never expose private resident details in admin or sponsor views.
11. Keep sample data visibly labelled.
12. Treat recycling impact as estimated, self-reported and methodology-dependent.
13. Use existing tokens and components from `packages/ui` rather than introducing a parallel design system.
14. This repository uses a nonstandard Next.js 16.4 setup. Before editing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
15. Do not add new infrastructure beyond Next.js and Supabase.

---

## 18. Useful source paths

### App routes
- `apps/web/app`
- `apps/web/app/(app)`
- `apps/web/app/(auth)`
- `apps/web/app/(sponsor)`

### Shared UI and app components
- `apps/web/components`
- `packages/ui/src/components`
- `packages/ui/src/styles/globals.css`

### Navigation and content
- `apps/web/content/navigation.ts`
- `apps/web/lib/i18n-copy.ts`
- `apps/web/lib/env.ts`

### Recycling
- `apps/web/app/(app)/recycling`
- `apps/web/components/recycling`
- `apps/web/components/admin/recycling-forms.tsx`
- `apps/web/actions/recycling.ts`
- `apps/web/lib/recycling.ts`
- `apps/web/lib/validation/recycling.ts`
- `supabase/migrations/*recycling*.sql`
- `apps/web/e2e/recycling.spec.ts`
- `apps/web/tests/recycling.test.ts`

### Design and system docs
- `docs/DESIGN_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY_AND_SAFETY.md`
- `docs/METRICS.md`
- `README.md`
- `PROGRESS.md`

### Migrations and seed data
- `supabase/migrations`
- `scripts/seed-demo.ts`
