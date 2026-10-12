# BorrowBetter: design handoff, direction E3 ("Creative, Band")

Mobile web app for neighbourhood borrowing, events, helping and rewards. This bundle covers the **Home** and **Borrow** screens in direction E3. Events and Impact were only designed in direction A (Fresh), not in E3.

Designed at **390 x 844**. No other widths were designed (see "Not yet designed").

## Bundle

| File | Purpose |
|---|---|
| `HANDOFF.md` | This spec |
| `tokens.json` | Design tokens (DTCG-style JSON) |
| `tokens.css` | Same tokens as plain CSS variables (`--bb-*`) |
| `shadcn-theme.css` | Maps tokens to shadcn/ui theme variables and Tailwind v4 `@theme` |
| `icons/*.svg` | Tab bar icons (24px, `currentColor`) |

## Direction in one paragraph

A dark indigo **band** anchors the top of each screen (greeting, points and main action on Home; title and search on Borrow). Below it, calm white cards with a soft shadow on a pale lilac ground. Colour is used in small, deliberate doses: tinted image blocks, filter chips, and one coral CTA.

## Foundations

### Colour

| Name | Hex | HSL (shadcn v3) | Use |
|---|---|---|---|
| Ink | `#1B1340` | `251 54% 16%` | Text, band background, primary button |
| Ink muted | `#4A4570` | `247 24% 35%` | Secondary text (meta lines, inactive tab icons) |
| Ground | `#F6F4FB` | `257 47% 97%` | Page background |
| Surface | `#FFFFFF` | `0 0% 100%` | Cards, search field, tab bar |
| Border | `#E7E2F7` | `254 57% 93%` | 1px card, search and tab-bar borders |
| Band eyebrow | `#CFC8F0` | `250 57% 86%` | Small text on the ink band |
| Sun | `#FFD23F` | `46 100% 62%` | Points chip, Borrow tile dot |
| Mint | `#7BE0B0` | `151 62% 68%` | Lend tile dot |
| Lilac | `#C9B8FF` | `254 100% 86%` | Help tile dot |
| Coral | `#FF6B4A` | `11 100% 65%` | "Find an item" CTA |
| Sun tint | `#FFF0B8` | `47 100% 86%` | Tools chip, item image 1, unavailable button |
| Mint tint | `#CFF0E0` | `151 52% 88%` | "I will help" button, Garden chip, item image 2 |
| Lilac tint | `#E2D9FF` | `254 100% 93%` | Active tab, Outdoor chip, item image 3 |
| Coral tint | `#FFD6CB` | `13 100% 90%` | Item image 4 |

### Contrast (WCAG, computed from the hex values above)

| Pair | Ratio |
|---|---|
| Ink on ground | 15.9:1 |
| Ink on surface | 17.3:1 |
| Muted on surface | 8.8:1 |
| Muted on ground | 8.1:1 |
| White on ink | 17.3:1 |
| Eyebrow on ink | 10.9:1 |
| Ink on coral (CTA) | 6.1:1 |
| Ink on sun (points chip) | 12.0:1 |
| Ink on mint tint (I will help) | 14.2:1 |
| Ink on sun tint (unavailable) | 15.2:1 |
| Ink on lilac tint (active tab, chip) | 12.9:1 |

All pairs used for text meet 4.5:1.

### Typography

Fonts: **Syne** (display, weight 700 only) and **DM Sans** (body, weights 400 and 700). Both from Google Fonts. No letter-spacing is applied.

| Role | Font | Size / line-height | Weight | Colour | Where |
|---|---|---|---|---|---|
| H1 (Home) | Syne | 32 / 1.05 | 700 | white | "Hey, neighbour!" |
| H1 (Borrow) | Syne | 30 / 1.1 | 700 | white | "What do you need today?" |
| Section heading | Syne | 18 / normal | 700 | ink | "Needs a hand" |
| Points number | Syne | 20 / 1 | 700 | ink | Points chip |
| Tile label | Syne | 16 | 700 | ink | Borrow / Lend / Help |
| Item name | Syne | 15 | 700 | ink | Item card |
| Eyebrow | DM Sans | 13 | 700 | band eyebrow | "Good morning" |
| Row title | DM Sans | 15 | 700 | ink | Request card |
| Row meta | DM Sans | 13 | 400 | ink muted | Request card |
| Item meta | DM Sans | 12 | 400 | ink muted | Owner and distance |
| CTA button | DM Sans | 15 | 700 | ink | "Find an item" |
| Row / chip button | DM Sans | 14 | 700 | ink | "I'll help", chips |
| Item button | DM Sans | 13 | 700 | white or ink | "Ask to borrow" |
| Chip caption | DM Sans | 11 | 700 | ink | "BetterPoints" |
| Input | DM Sans | 15 | 400 | ink | Search |

### Spacing, radius, shadow

- Spacing values used: 2, 8, 10, 12, 14, 16, 20, 24, 28, 32 px. Screen side padding is **20**. Vertical gap between sections is **16**.
- Radius: 12 (small buttons), 14 (CTA, points chip), 18 (cards, search), 28 (band bottom corners), full pill (chips, round tab buttons).
- Shadow: one only, `0 2px 10px rgba(27,19,64,0.08)`, on cards, search and tiles. Cards also have a 1px border in the `border` colour.

### Sizing and touch targets

Every tappable element is at least **44px** tall. CTA 48, search 52, tab buttons 48 x 48, tab bar 72.

## Components

**Band** (top of every screen). Background ink, bottom corners 28px, padding 32 top / 20 sides / 24 bottom, vertical flex with 16 gap. It does not scroll in the mockup (see "Not yet designed").
- Home: header row (space-between, top-aligned): left = eyebrow above H1, right = points chip. Under it the CTA, left-aligned (not full width).
- Borrow: H1 above the search field.

**Points chip.** Sun background, radius 14, padding 8 / 12. Number (Syne 20/1) with the "BetterPoints" caption (11 bold) underneath. Shows the user's balance.

**CTA button ("Find an item").** Coral background, ink text, no border, radius 14, min-height 48, padding 0 20, DM Sans 15 bold.

**Quick-action tile.** Card style (surface, 1px border, radius 18, card shadow), min-height 80, content centred in a column with 8 gap: a 20px solid circle (sun, mint, lilac for Borrow, Lend, Help) above a Syne 16 label. Three tiles in a 3-column grid, 12 gap. The circle is decorative.

**Request row (card).** Card style, padding 12 / 14, horizontal flex, 12 gap, vertically centred. Left (grows): title 15 bold, meta 13 muted. Right: secondary button "I'll help": mint tint background, ink text, no border, radius 12, min-height 44, padding 0 14, 14 bold.

**Search field.** Card style, height 52, padding 0 16, DM Sans 15, full width. Type `search`, with an aria-label. The mockup uses the browser's default placeholder colour; set it explicitly.

**Filter chip.** Min-height 44, padding 0 14, fully rounded, 14 bold, no border. Selected ("All") = ink background, white text. Others = tint background (Tools sun tint, Garden mint tint, Outdoor lilac tint) with ink text. 8 gap between chips.

**Item card.** Card style with `overflow: hidden`. Image block 76 high, tint background (sun, mint, lilac, coral tints in order), centred 40px placeholder icon (stroke ink, 1.6). Body padding 10 / 12 / 12: name (Syne 15), meta (12 muted, margin 2 0 10), full-width button, min-height 44, radius 12, 13 bold.
- Available: "Ask to borrow", ink background, white text.
- Unavailable: label shows the return day, e.g. "Back Thursday", sun tint background, ink text. The state is carried by the text, not only by colour.
- Items sit in a 2-column grid with 14 gap (rows and columns).

**Tab bar.** Full width, 72 high, surface background, 1px top border (border colour), items spaced evenly (space-around), horizontal padding 10. Each item is a 48 x 48 round button with a 24px icon (stroke 1.8, round caps and joins). Active = lilac tint background and ink icon. Inactive = no background and muted icon. Four items: Home, Borrow, Events, Impact. Icon-only, so each needs an accessible name.

## Screens

**Home** (top to bottom): band (eyebrow + H1 + points chip, then CTA) / 20 / tiles row / 16 / "Needs a hand" heading / 16 / three request cards with 16 between them / tab bar.

**Borrow**: band (H1 + search) / 20 / chip row / 16 / 2 x 2 item grid / tab bar.

Sample content used in the mockups (all names, numbers and places are placeholders):

- Points: 1,240 BetterPoints.
- Requests: "Help carrying a sofa" (Block C, 20 min, 30 pts), "Dog walk this evening" (Block A, 45 min, 40 pts), "Fix a wobbly gate" (Block D, 30 min, 25 pts).
- Items: Cordless drill (Mei Ling, 0.3 km), Folding table (Daniel, 0.5 km), Camping tent (Priya, 0.8 km, back Thursday), Pressure washer (Hafiz, 1.1 km).

## Accessibility

- All text pairs meet 4.5:1 (table above).
- Every interactive element is 44px or taller.
- Tab bar buttons are icon-only: give each an `aria-label` and mark the current one with `aria-current="page"`. Use `<nav>` with links, not buttons that fake navigation.
- Filter chips behave as a single-select toggle group: expose the selected state (`aria-pressed` or `role="radio"`).
- Tile dots and item placeholder icons are decorative (`aria-hidden`).

## Implementation notes (Next.js + shadcn/ui)

1. **Fonts** with `next/font/google`: `Syne({ weight: "700" })` and `DM_Sans({ weight: ["400", "700"] })`, exposed as CSS variables; point `--bb-font-display` and `--bb-font-body` at them.
2. **Theme**: import `tokens.css`, then `shadcn-theme.css`, in `app/globals.css`. For v3-style shadcn (HSL triplets): `--background: 257 47% 97%; --foreground: 251 54% 16%; --primary: 251 54% 16%; --secondary: 151 52% 88%; --accent: 254 100% 93%; --muted-foreground: 247 24% 35%; --border: 254 57% 93%;`
3. **Component mapping**

| Design | shadcn / build as |
|---|---|
| Card, tile, request row, item card | `Card` with `shadow-card`, `rounded-lg` |
| Search | `Input`, height 52 |
| Filter chips | `ToggleGroup` (type single) |
| "Ask to borrow", "Find an item", "I'll help", unavailable | `Button` variants below |
| Tab bar | Custom `<nav>`, not shadcn `Tabs` (it is route navigation) |
| Band | Custom layout component, no shadcn equivalent |

4. **Button variants** (cva, using the colours from `shadcn-theme.css`):

```ts
variant: {
  default:   "bg-primary text-primary-foreground",       // Ask to borrow
  cta:       "bg-coral text-ink",                        // Find an item
  secondary: "bg-secondary text-secondary-foreground",   // I'll help
  tint:      "bg-sun-tint text-ink",                     // Back Thursday
},
size: {
  default: "min-h-11 px-3.5 rounded-sm text-sm font-bold",
  cta:     "min-h-12 px-5 rounded-md text-[15px] font-bold",
  block:   "w-full min-h-11 rounded-sm text-[13px] font-bold",
}
```

5. **Safe area**: add `padding-bottom: env(safe-area-inset-bottom)` to the tab bar and `padding-top: env(safe-area-inset-top)` inside the band, with `viewport-fit=cover`.

## Not yet designed (needs a decision before build)

- Events and Impact screens in this direction. Direction A (Fresh) has them as a starting point, but with a different look.
- Hover, pressed, focus-visible and disabled states for every control. Suggested starting points: a visible 2px focus ring using `--ring`, and a slightly darker fill on press. These are proposals, not designs.
- Loading, empty and error states, including a search with no results.
- Widths other than 390. Suggested: fluid width with 20px side padding and the same 2- and 3-column grids.
- Scrolling. The mockups clip content; in production the area between band and tab bar should scroll, with bottom padding to clear the tab bar. Whether the band stays fixed or scrolls away is undecided.
- Search placeholder colour, real item photos (a tinted block with an icon stands in), and dark mode.
- An error/destructive colour is not defined; shadcn needs one before destructive variants are used.
