# Paste this into your IDE agent

Unzip this folder into the repo as `docs/design-handoff-option-c/`, then send:

---

Implement BorrowLah **Option C, "Your Block"**, described in `docs/design-handoff-option-c/HANDOFF.md`.

Read first: `HANDOFF.md`, then `components/COMPONENTS.md`, then `design-tokens/tokens.css`. `screenshots/` is the visual target; `screens/*.html` are static mockups with inline styles. Use them to check spacing and colour, but do NOT copy their markup. Rebuild with Tailwind, Server Components and our `packages/ui` primitives.

Work in this order and stop for my review after each step:
1. **Tokens and fonts.** Add `tokens.css` to `packages/ui/src/styles/globals.css` and load Bricolage Grotesque and Instrument Sans with `next/font/google`. List which old Option A tokens are now unused, but don't delete them yet.
2. **Shell.** `LimeScreen`/`Sheet`, `FloatingDock` (Block, Borrow, Events, Impact) and `ActionDock`.
3. **Home (`/home`).** `PointsRingChip`, `IntentComposer`, `PillarTag`, `FeedCard` (item/event/help) and the mixed "Near you, right now" feed. Propose the SQL view or RPC first and wait for approval before writing a migration.
4. **Item detail (`/borrow/items/[id]`).** `ItemHero`, `LenderRow`, `DayRangePicker`, `HandoverSpot`, `HandoverSteps`, `ActionDock`. Reuse `HandoverSteps` on `/borrow/bookings/[id]`.
5. **Event (`/events/[id]` and `/ticket`).** `TicketPass` with a real QR from the RSVP token.
6. **Impact (`/rewards`).** `ProgressRing`, `StatTile`, `RewardCard` scroller. Build `BlockGoalCard` last, and only after I approve the `block_goals` migration.

Rules:
- Text on lime, tomato, sky or mustard is #111111, never white. Tomato is for one primary action per screen.
- Visible focus ring; 44px minimum touch targets; no horizontal scroll at 320px; respect reduced motion.
- Shared spaces only and aggregates only (no home addresses, no resident lists on goals).
- Keep "Sample data" labels. If a backend feature isn't ready, hide its UI rather than faking numbers.
- No new infrastructure beyond Next.js and Supabase. Supabase migrations go through `supabase/migrations`, with RLS.

After each step, run `npm run lint --workspace web && npm run typecheck --workspace web`. At the end, also run `test` and `build`, and list anything under "Not designed yet" you had to improvise.
