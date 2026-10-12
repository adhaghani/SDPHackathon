BorrowBetter is a community participation and sustainability app for Malaysian townships. Residents borrow and lend items, join neighbourhood events, help neighbours and earn **BetterPoints (BP)** for verified real-world activity. Admins see aggregate signals; sponsors fund rewards. The promise is **Share more. Connect more. Live better.** The interface should feel welcoming to residents, useful to organisers, accountable to township offices and transparent to sponsors.

## Content fundamentals

- **Practical, local, trust-oriented.** Short sentences that say what happens next: "Request to borrow", "Check in with your QR", "Return by Sunday 6 PM". No hype, no exclamation stacks, no emoji in UI copy.
- **Second person for residents** ("You earned 20 BP"), plain third person for aggregate admin and sponsor copy ("312 residents joined an event this month").
- **Sentence case** for buttons, headings and tabs. The product name is always `BorrowBetter`, one word, two capitals. Points are `BetterPoints` in prose and `BP` next to a number ("1,240 BP").
- **The four township-line names stay in Malay**: Pinjam (borrow and lend), Jom (events), Tolong (helping), Rimba (sustainability and impact). Pair them with an English word the first time on a screen: "Pinjam · Borrow".
- **Points come from verified actions.** Say what was verified: "+20 BP · Drill returned and confirmed by both sides". Never imply points for opening the app.
- **Demo honesty.** Seeded residents, events, partners, rewards and metrics are fictional. Mark them with a visible "Demo data" label, and label impact figures "Estimated" with a link to methodology.
- **Privacy in words too.** Never print unit numbers, private messages or a named resident's activity in admin or sponsor views. Locations name shared spaces ("Dewan Komuniti", "Taman Rimba playground"), never homes.

## Visual foundations

**Colour.** Keep this palette; never swap it for a generic dark or blue SaaS theme.
- `ink` for text and dark bands, `ink-muted` for secondary text, on `ground` (page) and `surface` (cards).
- `coral` is the primary action and attention colour. Text on coral is `on-accent` (ink), never white.
- `sun` belongs to BetterPoints: the BP chip, totals and earned highlights. Do not use it for generic warnings.
- `mint` is positive and helping: Tolong, confirmations, verified check-ins. Always pair with a word or icon.
- `lilac` is the township line, map areas and soft interaction. Active navigation uses `lilac-tint`.
- Tints (`sun-tint`, `mint-tint`, `lilac-tint`, `coral-tint`) are soft backgrounds for rows and callouts, always with `ink` text.
- `border` is a decorative hairline. Controls that need an edge to be found use `ink-muted` or a fill.
- On `ink` bands, text is `surface`, eyebrows are `band-eyebrow`, and coral may appear as text.

**Type.** Syne (`display` family: `display-xl`, `display-lg`, `heading`, `title`) for headings, bold and compact. DM Sans (`sans`: `body`, `body-sm`, `label`, `eyebrow`, `numeric`) for everything else. Both are Google Fonts. Set BP, metrics and counts in `numeric` with tabular numerals.

**Shape and depth.** Cards are `surface` with a `border` hairline, `radius-lg` and `shadow-card`; on hover or focus they lift to `shadow-raised` without moving more than 2px. Hero and dark bands get a `radius-band` bottom radius. Pill CTAs and the BP chip use `radius-pill`.

**Spacing and layout.** 4px scale (`space-1` … `space-12`). Mobile gutter is `space-4` and must work at 320–390px with no horizontal scroll. Tablet and desktop use the full available width, with long text held to a readable measure (about 70 characters). Do not make every card identical: vary size and emphasis to show hierarchy.

**Navigation.** Mobile: a fixed bottom tab bar with four labelled tabs (Home, Borrow, Events, Impact), active tab in `lilac-tint` with a heavier icon, safe-area padding. The header there keeps compact icon buttons and hides the BP chip. Tablet and desktop: left sidebar with `lilac-tint` active rows, profile pinned to the bottom, BP chip in the header from the `sm` breakpoint up. Admins get a Township Pulse entry.

**Media.** Item and event posters are 3:4 (`MediaPoster`); event posters carry title, category, date and location over a dark ink gradient. Reward cards use a 4:3 image area, stretch to equal height and pin Redeem to the bottom. Badge icons sit in a 1:1 tile. Never crop labels or faces.

**The township line.** The signature motif: a `lilac` route with four `ink` stations, Pinjam, Jom, Tolong and Rimba, the current one in `coral`. Use it where it means movement or progress (onboarding, the Impact summary, a resident's activity path), not as background decoration.

**Motion.** Restrained: 150–200ms ease-out on hover, focus and tab changes. Respect `prefers-reduced-motion` by removing transforms and keeping only colour changes.

**States.** Loading, empty, error and permission states live in the interface, as inline panels with a clear next action, not only toasts or alerts. Error and 404 pages use the dark editorial `StatusPage`.

**Focus.** Every interactive element shows a 2px solid `focus-ring` outline with a 2px offset; on `ink` bands the ring is `surface`.

## Iconography

No icon set or logo files have been supplied to this system yet. Until they are, set the name in plain type (`BorrowBetter` in Syne 800) and use a single-weight outline icon set at 20–24px, drawn in `ink` or `ink-muted`; active icons get a heavier stroke rather than a new colour. No emoji as icons.
