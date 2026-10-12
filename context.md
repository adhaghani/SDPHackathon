# BorrowBetter — Simplified System Context

> This file is a handoff context for an AI Design partner. It describes the product, routes, visual system, interaction rules, data model and current implementation state in simplified language.

---

## 1. Product in one paragraph

BorrowBetter is a demo-ready community participation and sustainability system for Malaysian townships. Residents borrow and lend useful items, join neighbourhood events, help neighbours and earn **BetterPoints (BP)** for verified real-world activity. Township admins see aggregate participation and planning signals, not private resident activity. Sponsor partners can create rewards and challenges.

The core promise is:

> **Share more. Connect more. Live better.**

The product is intentionally practical, local and trust-oriented. It should feel welcoming to residents, useful to organisers, accountable to township offices and transparent to sponsors.

---

## 2. Product principles

1. **Real-world actions matter.** Points come from verified activity, never from merely opening the app.
2. **Privacy by default.** Private messages, unit labels and resident-level activity are not exposed to admins or sponsors.
3. **Shared spaces first.** Locations should be public/shared spaces, never private addresses.
4. **Progress is visible.** Residents should always understand what they can do next and what they have earned.
5. **Demo honesty.** All seeded residents, events, partners, rewards and metrics are fictional/demo data. Estimated impact figures must stay labelled as estimates.
6. **Township line is the signature motif.** The route/line metaphor represents movement through Pinjam, Jom, Tolong and Rimba.

---

## 3. Main audiences

### Residents
- Discover items to borrow.
- List items to lend.
- Join events and register as attendee or volunteer.
- Ask for or offer practical help.
- Track BetterPoints, levels, badges and vouchers.
- Manage comfort preferences and profile visibility.

### Organisers / event staff
- Create and manage events.
- Open QR/manual check-in.
- Verify volunteer hours.
- Complete an event after enough verified attendance.

### Township admins
- Review aggregate participation through Township Pulse.
- Manage members, moderation, disputes, programme costs and rewards economy.
- Manage the awards catalogue.
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

### Resident app
- `/home` — greeting, quick actions, to-dos, nearby events, items to borrow, recent activity.
- `/borrow` — searchable/filterable item catalogue with pagination.
- `/borrow/new` — list an item.
- `/borrow/items/[id]` — item detail and booking request.
- `/borrow/bookings/[id]` — booking flow and two-sided confirmation.
- `/borrow/mine` — borrowing, lending and own items.
- `/events` — event catalogue, meetup map and pagination.
- `/events/new` — host an event.
- `/events/[id]` — event detail, poster, meetup map, RSVP.
- `/events/[id]/ticket` — QR ticket.
- `/events/[id]/manage` — check-in desk and event map.
- `/events/mine` — registered and hosted events.
- `/community` — announcements, help requests and interest groups.
- `/challenges`
- `/rewards` — BP balance, levels, badges, latest activity, reward catalogue, vouchers.
- `/rewards/activity` — full paginated activity history.
- `/notifications`
- `/profile`
- `/profile/settings`
- `/ai`

### Admin app
- `/admin` — Township Pulse dashboard.
- `/admin/badges` — add/update awards.
- `/admin/budget`
- `/admin/disputes`
- `/admin/hubs`
- `/admin/insights`
- `/admin/map`
- `/admin/members`
- `/admin/methodology`
- `/admin/moderation`
- `/admin/rewards`

### Partner app
- `/sponsor/portal`

---

## 5. Navigation behavior

### Mobile
- Fixed bottom tab bar with four labelled tabs:
  - Home
  - Borrow
  - Events
  - Impact
- Active tab has a lilac tint background and stronger icon weight.
- Safe-area padding is included.
- Header keeps compact icon controls and hides the BetterPoints chip to preserve space.

### Tablet / desktop
- Sidebar on the left.
- Active navigation uses a lilac tint.
- Admin gets a Township Pulse entry.
- Profile is anchored at the bottom of the sidebar.
- BetterPoints appears in the top header from the `sm` breakpoint upward.
- Content uses the available width rather than a fixed central container.

---

## 6. Visual system

### Color theme
Keep the existing palette. Do not replace it with a generic dark/blue SaaS theme.

Core tokens:
- Ink: `#1B1340`
- Ink muted: `#4A4570`
- Ground: `#F6F4FB`
- Surface: `#FFFFFF`
- Border: `#E7E2F7`
- Band eyebrow: `#CFC8F0`
- Sun: `#FFD23F`
- Mint: `#7BE0B0`
- Lilac: `#C9B8FF`
- Coral: `#FF6B4A`
- Tints: sun, mint, lilac and coral variants.

Semantic roles:
- Ink = primary text and dark bands.
- Sun = BetterPoints, high-salience highlights.
- Coral = primary action / attention.
- Mint = positive/helping state.
- Lilac = active navigation, route line, map area and soft interaction state.

### Typography
- Display face: Syne.
- Body face: DM Sans.
- Keep headings bold and compact.
- Body text should remain readable at mobile sizes.
- Tabular numerals are used for BP, metrics and counts.

### Shape and spacing
- Cards use the existing soft radius system.
- Bands use a larger bottom radius.
- Cards have subtle border and shadow.
- Interactive cards should provide hover/focus feedback without excessive motion.
- Motion is restrained and respects reduced-motion preferences.

### Signature motif
The **township line** is the memorable visual motif:
- Pinjam = borrow/lend route.
- Jom = events.
- Tolong = helping.
- Rimba = sustainability / impact.

Use the line motif in meaningful places, not as decoration everywhere.

---

## 7. Current UI enhancements already implemented

### Mobile/desktop foundation
- Labeled mobile tab bar.
- Improved desktop sidebar and active states.
- Compact responsive header controls.
- Notification count is a small circular badge on the bell.
- Counts above 99 display as `99+`.
- BetterPoints is persistent in the desktop/tablet header.
- App content uses full available width on larger screens.

### Shared components
- `apps/web/components/shared/media-poster.tsx`
  - Responsive poster image.
  - Default event/item ratio is `3:4`.
  - Supports gradient text overlay for contrast.
- `apps/web/components/shared/pagination.tsx`
  - Shared Previous/Next pagination.
- `apps/web/components/shared/status-page.tsx`
  - Shared 404/error visual shell.
- `apps/web/components/map/event-map.tsx`
  - Event meetup maps using the shared `packages/ui` map component.
- `apps/web/components/rewards/badge-card.tsx`
  - Award cards with 1:1 icon area and minimal text.

### Error pages
- `/404` and global error pages use a dark, editorial status-page treatment.
- Large muted “Oops!” heading, white headline, white pill CTA and three quick-route cards.

---

## 8. Media and poster rules

### Items
- Borrow listings use a 3:4 poster image.
- Seeded items have themed SVG mock images under `apps/web/public/demo/`.
- User-created items can upload compressed WebP images.
- Fallback remains the demo illustration when storage is unavailable.

### Events
- Event cards and event details use a 3:4 poster.
- The event title/category/date/location are embedded over the image with a dark gradient for contrast.
- Event creation supports an optional cover upload.
- `events.cover_path` stores the image path.
- Seeded events fall back to `/demo/event-placeholder.svg`.

### Rewards
- Reward catalogue cards use a consistent 4:3 image area.
- Cards stretch to equal height in each grid row.
- Redeem buttons are pinned to the bottom with `mt-auto`.
- Reward images are optional and stored in `rewards.image_path`.
- Reward kinds map to themed fallback posters:
  - `voucher`
  - `event_perk`
  - `amenity`

### Badges / awards
- Badge icon area is 1:1.
- Minimal label appears under the icon.
- Description reveals on desktop hover.
- Admin can add/update awards at `/admin/badges`.
- Awards are stored in the `badges` table with `icon`, `description` and JSON `criteria`.

---

## 9. Maps

The shared map implementation lives in:

`packages/ui/src/components/map.tsx`

The event wrapper lives in:

`apps/web/components/map/event-map.tsx`

Current usage:
- `/events` shows a meetup map for upcoming events.
- `/events/[id]` shows the event meetup location and neighbourhood area.
- `/events/[id]/manage` shows the same map for organisers/admins.

Current limitation:
- The database does not yet store latitude/longitude for events, facilities or neighbourhoods.
- The wrapper maps known demo neighbourhood/facility names to deterministic demo coordinates.
- Replace the resolver with real coordinates when the data model gains them.

---

## 10. Data and backend model

### Stack
- Next.js App Router.
- React 19.
- Supabase Auth, Postgres, Storage and Realtime.
- Server Components and Server Actions.
- Zod validation.
- Tailwind CSS and shared shadcn/Base UI components in `packages/ui`.

### Important tables
- `townships`
- `neighbourhoods`
- `facilities`
- `profiles`
- `township_members`
- `events`
- `event_staff`
- `event_rsvps`
- `items`
- `bookings`
- `booking_messages`
- `points_ledger`
- `levels`
- `badges`
- `user_badges`
- `notifications`
- `partners`
- `rewards`
- `redemptions`
- `challenges`
- `announcements`
- `help_requests`
- `interest_groups`

### Important integrity rules
- RLS is enabled across resident data.
- Integrity-critical writes use `SECURITY DEFINER` Postgres functions.
- Server actions validate inputs and authenticate the user.
- Service-role access is limited to server-only seeding, demo reset and cron/admin work.
- Booking transitions use two-sided confirmation.
- Points are recorded in `points_ledger`, not calculated only in the UI.
- Badge evaluation runs through database logic.

---

## 11. Demo data

The seed script is:

`scripts/seed-demo.ts`

It creates:
- Fictional demo users.
- Harmoni Heights demo township.
- Neighbourhoods and facilities.
- Events with cover paths.
- Items with mock images.
- Bookings, RSVPs, check-ins, points and badges.
- Partner rewards/challenges and other engagement data.

Useful commands:
- `npm run seed`
- `npm run demo:reset`
- `npm run db:push`
- `npm run types:gen`

Do not present demo names, metrics or estimated impact as real-world claims.

---

## 12. Design constraints for an AI Design partner

1. Preserve the existing color palette unless explicitly asked to redesign the brand.
2. Keep the township-line metaphor as the identity anchor.
3. Do not make every card look identical; use hierarchy and whitespace.
4. Keep controls familiar, labeled and keyboard-accessible.
5. Mobile must remain usable at 320–390px.
6. Desktop/tablet should use available width, with readable text measures where content becomes long.
7. Posters must not crop labels or faces.
8. Buttons should have clear action names and stable dimensions.
9. Loading, empty, error and permission states should live in the interface, not rely only on alerts.
10. Never expose private resident details in admin or sponsor views.
11. Keep demo data visibly labelled.
12. Do not add new infrastructure beyond Next.js and Supabase.

---

## 13. Useful source paths

### App routes
- `apps/web/app`
- `apps/web/app/(app)`
- `apps/web/app/(auth)`
- `apps/web/app/(sponsor)`

### Shared UI and app components
- `apps/web/components`
- `packages/ui/src/components`
- `packages/ui/src/styles/globals.css`

### Design and system docs
- `docs/DESIGN_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY_AND_SAFETY.md`
- `docs/METRICS.md`
- `README.md`

### Migrations and seed data
- `supabase/migrations`
- `scripts/seed-demo.ts`

---

## 14. Verification expectations

Before shipping a design or implementation change, run:

```bash
npm run lint --workspace web
npm run typecheck --workspace web
npm run test --workspace web
npm run build --workspace web
```

For UI changes, also check:
- 320px mobile width.
- 390px mobile width.
- 768px tablet width.
- 1440px desktop width.
- No horizontal overflow.
- Keyboard focus visibility.
- Empty/loading/error states.
- Reduced motion behavior.
