# Paste this into your IDE agent

Unzip this folder into the repo as `docs/design-handoff/`, then send:

---

Implement the BorrowBetter UI refresh described in `docs/design-handoff/HANDOFF.md`.

Context:
- Read `HANDOFF.md` first, then `design-tokens/brand-guidelines.md`, then the spec in `components/` for each component you touch.
- `screenshots/` shows the target. `screens/*.html` are static mockups with inline styles; use them to check exact spacing and colour, but do NOT copy their markup. Rebuild with our existing `packages/ui` components, Tailwind utilities and Server Components.
- Keep the existing data flow (Supabase, Server Actions, RLS). Replace the mock numbers with real queries as listed under "Data the screens assume". Admin views must use aggregates only.

Work in this order and stop for review after each step:
1. **Tokens:** merge `design-tokens/tokens.css` into `packages/ui/src/styles/globals.css`. Where a value already exists there, keep ours and tell me which placeholder values you didn't use.
2. **App shell:** `TabBar` (mobile), `Sidebar` (tablet and up), header with `BetterPointsChip` and `NotificationBell`.
3. **Shared components:** `TownshipLine`, restyled `MediaPoster`, `RewardCard`, `BadgeCard`, `Pagination`, plus `QuickActionCard`, `TodoRow`, `ActivityRow`, `StatTile`.
4. **Screens:** `/home`, `/borrow`, `/events/[id]`, `/rewards`, `/admin`.

Rules: text on coral, sun, mint or lilac is ink, never white. Visible 2px focus ring. No horizontal scroll at 320px. Respect reduced motion. Keep "Demo data" and "Estimated" labels. No new dependencies or infrastructure.

After each step, run `npm run lint --workspace web && npm run typecheck --workspace web`. At the end, also run `test` and `build`, and list anything from "Known gaps" you couldn't resolve.
