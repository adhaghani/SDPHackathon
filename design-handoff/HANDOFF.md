# BorrowBetter — UI handoff

Design handoff for the BorrowBetter web app (Next.js App Router + Tailwind + shadcn/Base UI in `packages/ui`). It covers six reference screens, design tokens and component specs. **The screens are static HTML mockups with inline styles: they are a visual reference, not code to paste.** Rebuild them with the existing components, Tailwind utilities and Server Components.

## What's in the package

| Path | What it is |
| --- | --- |
| `PROMPT.md` | A ready-to-paste instruction for your IDE agent |
| `screenshots/*.png` | Rendered screens (mobile at 2x, desktop at 1440px) |
| `screens/*.html` | The same screens as standalone HTML; open them in a browser and inspect exact spacing and colours |
| `design-tokens/tokens.css` | CSS variables and a Tailwind v4 `@theme` mapping to merge into `packages/ui/src/styles/globals.css` |
| `design-tokens/tokens.json` | The same tokens as data, each with a usage note |
| `design-tokens/brand-guidelines.md` | Voice, colour roles, type, layout, navigation, media and motion rules |
| `components/*.md` | One spec per component: what it does and what props or data it needs |
| `components/reference-styles.css` | Reference CSS for those components (class names prefixed `bb-`). Translate to Tailwind; don't import it |

## Screen → route map

| Screen | Route | Main source files to touch |
| --- | --- | --- |
| `01-mobile-home` / `05-desktop-home` | `/home` | `apps/web/app/(app)/home/page.tsx` |
| `02-mobile-borrow` | `/borrow` | `apps/web/app/(app)/borrow/page.tsx`, `components/shared/media-poster.tsx`, `components/shared/pagination.tsx` |
| `03-mobile-event-detail` | `/events/[id]` | `apps/web/app/(app)/events/[id]/page.tsx`, `components/map/event-map.tsx` |
| `04-mobile-impact-rewards` | `/rewards` | `apps/web/app/(app)/rewards/page.tsx`, `components/rewards/badge-card.tsx` |
| `06-desktop-admin-township-pulse` | `/admin` | `apps/web/app/(app)/admin/page.tsx` |
| App shell (tab bar, sidebar, header) | all `(app)` routes | the `(app)` layout and its nav components |

Paths follow the system context doc. Confirm them against the repo before editing.

## Component inventory

**Already exist, so restyle to match:** `MediaPoster` (3:4), `Pagination`, `StatusPage`, `BadgeCard` (1:1), `EventMap`.

**Likely new, or extracted from inline markup:**
- `TabBar`: mobile, four labelled tabs, `lilac-tint` active state
- `Sidebar`: tablet and up, profile pinned to the bottom, Township Pulse for admins
- `BetterPointsChip`: `sun` pill, shown in the header from `sm` up
- `NotificationBell`: coral count circle, `99+` cap
- `TownshipLine`: four stations with done, current and upcoming states
- `RewardCard`: 4:3 image, equal heights, Redeem pinned with `mt-auto`
- `QuickActionCard`, `TodoRow`, `ActivityRow` (`+20` BP pill), `StatTile` (admin KPI)

Each one with a spec has a matching file in `components/`.

## Rules that matter most

1. **Text on coral, sun, mint or lilac is always `ink`, never white.** White on coral is 2.8:1 and fails contrast.
2. **Coral = primary action, sun = BetterPoints only, mint = helping or positive, lilac = route line and active navigation.**
3. **`border` (#E7E2F7) and `lilac` are decorative** (under 3:1 on white). Inputs and secondary buttons need an `ink-muted` edge.
4. **Focus:** 2px solid `ink` outline with a 2px offset everywhere; `surface` on dark bands.
5. **Privacy:** admin and sponsor views show aggregates only. Never show unit labels, private messages or a named resident's activity.
6. **Demo honesty:** seeded content shows a visible "Demo data" label; impact figures say "Estimated" and link to `/admin/methodology`.
7. **Posters** never crop labels or faces; event text sits on an `ink` gradient scrim.
8. **Mobile** must work at 320–390px with no horizontal scroll; the mobile header hides the BP chip.
9. **Motion** is 150–200ms ease-out, with transforms removed under `prefers-reduced-motion`.
10. **No new infrastructure** beyond Next.js and Supabase.

## Data the screens assume

Every number and name in the mockups is invented. Wire them to:
- **BP balance and level progress:** `points_ledger` and `levels`
- **Activity rows:** `points_ledger`, with the verified reason as the subtitle
- **To-dos:** pending `bookings` (return due, request to confirm) and RSVPs
- **Badges:** `badges` and `user_badges`
- **Rewards:** `rewards` (`kind`, `image_path`, cost) and `partners`
- **Admin KPIs and neighbourhood table:** aggregate queries only, through a `SECURITY DEFINER` function, never raw resident rows
- **"Waste avoided" and similar figures:** estimates; keep the label

## Known gaps and placeholders

- **Placeholder tokens:** the tints, radii, shadows and type sizes are guesses. Where `globals.css` already has values, those win.
- **Desktop event grid:** in `05-desktop-home` it wraps 3 + 1 at 1440px. Show 3 (or 6) cards, or use 4 columns.
- **Not designed yet:** QR ticket, organiser check-in desk, `/community`, `/challenges`, sponsor portal, onboarding, empty, loading and error states for these screens.
- **Icons:** the mockups use generic outline icons. Use the project's existing icon set (lucide-react, if that's what shadcn installed).

## Done when

- `npm run lint`, `typecheck`, `test` and `build` pass (`--workspace web`).
- Each screen is checked at 320, 390, 768 and 1440px with no horizontal overflow.
- Keyboard focus is visible on every control; reduced motion is respected.
