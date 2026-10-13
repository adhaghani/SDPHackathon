# BorrowLah — Option C "Your Block": UI handoff

Option C is a redesign of the resident mobile app: a new brand palette and fonts, a new floating navigation, and four UX ideas. **The screens in `screens/` are static HTML mockups with inline styles. Use them for visual reference only and rebuild with Tailwind and the components in `components/COMPONENTS.md`.**

> ⚠️ This direction replaces Option A's palette (ink/lilac/coral/sun), Syne/DM Sans, and the "township line" motif. If the team wants to keep any of those, decide before starting.

## What's in the package

| Path | What it is |
| --- | --- |
| `PROMPT.md` | A ready-to-paste instruction for your IDE agent |
| `screenshots/*.png` | Each screen at 390×844 (2x), plus `*-full.png` showing the whole scrolled page |
| `screens/*.html` | Standalone HTML for each screen; open in a browser and inspect |
| `design-tokens/tokens.css` | Colours, radii, shadow, fonts, type scale and focus ring, plus a Tailwind v4 `@theme` mapping |
| `components/COMPONENTS.md` | A spec, props and behaviour for every component |

## The direction in one paragraph

The look is bold, like a street sign: a lime green background, near-black ink, white "sheets" that slide up over the colour, and one colour per pillar (PINJAM sky, JOM lime, TOLONG mustard). Tomato is reserved for the one primary action on each screen. Headings use Bricolage Grotesque and body text uses Instrument Sans (both Google Fonts). Navigation is a floating dark dock. The aim is that the app feels like a neighbourhood, not a dashboard.

## Screens → routes

| Screen | Route | Notes |
| --- | --- | --- |
| `01-home-ask-the-block` | `/home` | `IntentComposer` + mixed "Near you, right now" feed |
| `02-item-and-handover` | `/borrow/items/[id]` | `DayRangePicker`, `HandoverSpot`, `HandoverSteps`, `ActionDock`. Reuse the steps on `/borrow/bookings/[id]` |
| `03-event-ticket` | `/events/[id]` after sign-up, and `/events/[id]/ticket` | `TicketPass`. The before-sign-up state uses the same page with an "I'm going" `ActionDock` (not mocked up) |
| `04-impact-and-block-goal` | `/rewards` (labelled **Impact**) | `ProgressRing`, `StatTile`, `BlockGoalCard`, `RewardCard` scroller |

The tab labelled **"Block"** is the Home tab and stays at `/home`. Only the label changes.

## The four UX ideas (and why)

1. **Start from what you need.** Home opens with "I need… / I can offer…" and one input, instead of separate Borrow, Lend, Event and Help buttons. Residents think "I need a ladder", not "I should open the Borrow section".
2. **One feed, sorted by distance.** Items, events and help requests appear together, each with a walking time. Proximity is the real decision driver in a township.
3. **Visible handover.** Item pages explain the two-sided confirmation before anyone requests, using the same 3-step tracker that later shows live booking status. This builds trust and reduces disputes.
4. **Shared block goal.** Impact adds a monthly goal for the whole block, with your own share highlighted. Collective goals encourage cooperation more than individual leaderboards, and they need no resident-level exposure.

## Backend work required (new features)

| Feature | What's needed | Suggested approach |
| --- | --- | --- |
| Mixed nearby feed | One query across `items`, `events`, `help_requests` | A SQL view or RPC returning `{type, id, title, meta, starts_at, facility_id}` with RLS respected |
| Walking time | Coordinates for facilities and neighbourhoods (the context doc notes these are missing) | Add `lat`/`lng` to `facilities` and `neighbourhoods`; estimate time between the resident's neighbourhood and the facility, never from a home address |
| Intent composer | Search with a fallback to posting | Search items and offers; with no result, prefill a `help_requests` post; "I can offer" prefills `/borrow/new` |
| Item availability | Blocked days per item | Derive from `bookings` (approved/active) |
| Lender trust line | Count of completed on-time returns | Aggregate over `bookings` where the item's owner = lender |
| Block goal | A new `block_goals` table: township_id, neighbourhood_id, metric, target, period, bonus_bp | Progress from an aggregate over `bookings` or `points_ledger` via a `SECURITY DEFINER` function; pay the bonus through `points_ledger` when the target is met. Show aggregates only |
| Ticket QR | An RSVP token | Use the existing check-in token from `/events/[id]/ticket` |

If any of these won't make the hackathon deadline, hide that UI element rather than faking it. Every number shown must come from real data or say "Sample data".

## Rules

1. Text on lime, tomato, sky and mustard is always `ink` (#111111), never white.
2. Tomato is used once per screen, for the main action (plus "your share" in the goal bar).
3. Pillars are named in text (PINJAM / JOM / TOLONG), not told apart by colour alone.
4. Focus ring: 3px solid `ink`, 2px offset; `lime` on dark screens.
5. Touch targets are at least 44px; body text never goes below 14px.
6. Privacy: shared spaces only, aggregates only on goals, no resident names on admin or sponsor surfaces.
7. Keep the "Sample data" labels; goal figures and walking times are illustrative until real.
8. Motion: the sheet slides up and the dock appears over 150–200ms, with transforms turned off under `prefers-reduced-motion`.

## Not designed yet

Desktop and tablet layouts (suggestion: the dock becomes a left rail and the sheet becomes a centred column of about 640px), the admin Township Pulse, the sponsor portal, `/borrow` list, `/community`, the pre-sign-up event state, onboarding, and empty, loading and error states. Ask for these before building them.

## Done when

- `npm run lint`, `typecheck`, `test` and `build` pass (`--workspace web`).
- Each screen is checked at 320, 390 and 768px with no horizontal overflow. At 320px, the Home greeting and chips must wrap cleanly.
- Every control is keyboard-reachable with a visible focus ring, and reduced motion is respected.
