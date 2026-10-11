# BorrowBetter design plan

This plan implements section 8 of the build brief. It is reviewed against the pinned direction and the "generated-page tells" checklist before any UI is built.

## 1. Design premise

BorrowBetter should feel like a well-used neighbourhood noticeboard crossed with a transit map: civic, legible, practical and distinctly Malaysian without using real brands, logos or people. The one memorable element is **the township line**. Everything else is quiet, disciplined and optimized for older readers, shared phones and quick task completion.

The interface is mobile-first. Residents act from lists, rows and clear next steps; managers get denser desktop tables and charts. No page is a grid of identical rounded cards.

## 2. Colour tokens

### Core light theme

| Token    |       Hex | Role                                              |
| -------- | --------: | ------------------------------------------------- |
| `embun`  | `#F4F7F5` | Canvas and page background                        |
| `tinta`  | `#0F3B45` | Primary ink, text, icons and dark surfaces        |
| `pinjam` | `#1F5FD1` | Borrow line and borrow-related actions/data       |
| `jom`    | `#E4572E` | Event line and event-related actions/data         |
| `tolong` | `#A83A8C` | Help line and help-related actions/data           |
| `rimba`  | `#2F8F5B` | Planet, sustainability and impact                 |
| `emas`   | `#F0B429` | BetterPoints only; never used for another feature |

Text-safe variants: when these colours carry small text on Embun or white, use `jom-ink #CA421A` and `rimba-ink #2A8052`. Pinjam and Tolong already exceed 4.5:1 on both. Emas is a surface/stroke colour; use Tinta text on Emas and Tinta text beside it on Embun.

### Semantic shadcn mapping

- `--background: #F4F7F5`, `--foreground: #0F3B45`
- `--card: #FFFFFF`, `--card-foreground: #0F3B45`
- `--primary: #0F3B45`, `--primary-foreground: #FFFFFF`
- `--secondary: #E7EFEC`, `--secondary-foreground: #0F3B45`
- `--muted: #E7EFEC`, `--muted-foreground: #466168`
- `--border: #CCD9D5`, `--input: #B9CBC6`, `--ring: #1F5FD1`
- `--destructive: #B42318`, `--destructive-foreground: #FFFFFF`
- Line tokens: `--line-borrow`, `--line-event`, `--line-help`, `--line-impact`, `--points`

### Dark theme

- `background #081D22`, `foreground #F4F7F5`
- `card #102B31`, `muted #173840`, `border #315159`
- `primary #F4F7F5` with Tinta foreground
- Lightened line colours: Pinjam `#78A4FF`, Jom `#FF8A61`, Tolong `#E58CD5`, Rimba `#65C68D`, Emas `#F0B429`
- Colour never carries meaning alone: line type also uses icons, labels and stroke patterns.

### Contrast and colour rules

- Normal text targets at least 4.5:1; large text and non-text controls at least 3:1.
- Emas appears only in BetterPoints balances, stamps, ledger deltas and reward accents.
- Gradients, cream/serif/terracotta combinations, near-black/acid palettes and decorative single-accent headlines are prohibited.
- Charts use line tokens plus direct labels and accessible table fallbacks.

## 3. Typography

| Role                                             | Typeface                                            | Settings                                                  |
| ------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------- |
| Display, page headings, numerals, points counter | Bricolage Grotesque                                 | 600–700, tight but never negative tracking, sentence case |
| Body and UI                                      | Atkinson Hyperlegible or Atkinson Hyperlegible Next | 400–700, minimum 16 px, line-height 1.5                   |
| Technical codes/vouchers                         | Atkinson Hyperlegible with tabular numerals         | Never monospace unless copying/scanning requires it       |

- Load both through `next/font`.
- Main content line length stays under 70 characters.
- Heading scale: 24/32/40/48 px mobile-to-desktop; body 16 px; small text never below 14 px.
- Points use tabular numerals. Letter spacing is always `0`.
- Sentence case everywhere; no tracked-out ALL CAPS eyebrows.

## 4. Shape, spacing and structure

- Spacing uses a 4 px base with primary rhythm at 8, 12, 16, 24, 32, 48 and 72 px.
- Radius: controls 8 px, panels 14 px, hero elements 24 px. Individual cards are not nested inside cards.
- Prefer 1 px borders and list rows with dividers over shadows. Shadows are reserved for modal elevation.
- Minimum target size: 44 × 44 px. Primary mobile actions sit in the lower thumb zone.
- No identical-card dashboard grids: tiles vary by hierarchy, while dense data uses rows, tables and dividers.
- Numbered markers appear only for real sequences: onboarding, booking timeline and demo walkthrough.

## 5. The township line

A route diagram with a 6 px stroke, circular stops and accessible labels:

```text
Pinjam  o----o----o          borrow stops
Jom     o---------o----o     event stops
Tolong       o----o          help stops
Rimba  o----------------o    impact milestones
Emas                 [stamp] BetterPoints moment only
```

Rules:

- Resident home shows a personal route: level stops plus recent verified contributions.
- Admin Pulse shows a collective route with milestone stops.
- Landing shows real-feeling demo stops: “Lent a ladder”, “Joined the Saturday gotong-royong”, “Helped carry groceries”.
- The line is inline SVG or semantic HTML/CSS; it is decorative only when equivalent text exists.
- One orchestrated animation: after verified points, the count-up lands and the stamp snaps onto the route. All other motion is user-triggered.
- `prefers-reduced-motion` and the profile “Reduce motion” setting disable transforms, count-up and line drawing.

## 6. Navigation and page anatomy

### Resident navigation

- Mobile: fixed bottom tab bar — Home, Events, Borrow, Rewards, Community — plus safe-area padding.
- Desktop: left side navigation with profile/settings access.
- Admin: desktop-first side navigation; usable on tablet; never crammed into the resident bottom bar.

### Shared page pattern

1. Skip link and semantic landmarks.
2. Compact page title, one-sentence context and one primary action.
3. To-do or time-sensitive action before discovery content.
4. Route-line motif where progress or contribution is the subject.
5. List rows with dividers for repeated content.
6. Meaningful empty/loading/error state with a direct next action.

## 7. ASCII wireframes

### Resident home

```text
+--------------------------------------------------+
| Harmoni Heights            Demo data       o o o |
+--------------------------------------------------+
| To do                                             |
| o Confirm pressure washer return        [Open ]  |
| o Approve Saturday clean-up ticket       [Open ] |
+--------------------------------------------------+
| BetterPoints                         1,250 BP    |
| Newcomer o----o====o======o  Contributor          |
|                       (stamp lands here)         |
+--------------------------------------------------+
| On the township line                              |
| Jom   o  Saturday gotong-royong        9 slots    |
|       Join event                               > |
| Pinjam o  Pressure washer               Free     |
|        Request to borrow                  >      |
| Rimba  o  Community garden challenge    70%      |
+--------------------------------------------------+
| Home   Events   Borrow   Rewards   Community      |
+--------------------------------------------------+
```

### Event ticket

```text
+--------------------------------------------------+
| < Back                    Saturday clean-up       |
+--------------------------------------------------+
| Event pass                                       |
|                                                  |
|        +--------------------------------+        |
|        | :::::  QR  :::::               |        |
|        | :::: rotates in 18s :::::      |        |
|        | :::::           :::::          |        |
|        +--------------------------------+        |
|   Aisyah binti Rahman                             |
|   18 October · 8:00 am · Anggun Hall              |
|                                                  |
|   Status: Ready to scan                          |
|                                                  |
| [ Add to calendar ]            [ Share ticket ]  |
+--------------------------------------------------+
```

### Booking timeline

```text
+--------------------------------------------------+
| Pressure washer                       #A184      |
| Requested by Aisyah · from Hasan                  |
+--------------------------------------------------+
| Requested  o------------------------------------  |
|            10 Oct · sent                         |
|                                                  |
| Approved   o------------------------------------  |
|            10 Oct · Hasan approved               |
|                                                  |
| Handed over  o----------------------------------  |
|              Meeting point shared in chat        |
|              [ Confirm handover ]                |
|                                                  |
| Returned     o----------------------------------  |
|              [ Mark returned ]                   |
|                                                  |
| Completed    o                                   |
|              Points are awarded here only        |
+--------------------------------------------------+
| Chat                         [ Report an issue ] |
+--------------------------------------------------+
```

### Admin Township Pulse

```text`
+----------------+--------------------------------------------------+
| Township office| Township Pulse 7d 30d 90d |
| Pulse | Observed activity in Harmoni Heights (Demo) |
| Insights +----------------+----------------+----------------+
| Members | Active | Attendance | Reuse |
| Events | 128 +12% | 214 +18% | 46 loans +9 |
| Rewards +----------------+----------------+----------------+
| Moderation | Weekly active residents |
| Budget | /\\ |
| Methodology | / \\_____ |
| Export +---------------------------------------------------+
| | Township line |
| | o---o---o---o---o 4 milestones reached |
| +---------------------------------------------------+
| | Verified attendance by category | Activity mix |
| | Jom bars | Rimba/Pinjam... |
+----------------+--------------------------------------------------+

```

## 8. Microcopy rules

- Sentence case, plain verbs, active voice.
- Keep action names stable: “Request to borrow” → “Request sent”.
- Errors explain what happened and how to fix it, without apologizing.
- Empty states invite action: “No events this week. Host one or browse next week.”
- Use light Malaysian flavour with a plain gloss: “gotong-royong (community clean-up)”.
- Estimated values always say “estimated”. Demo data always says “Demo data”.
- Copy lives centrally in `src/content/` (mapped to `apps/web/content/` in this monorepo).

## 9. Motion specification

| Moment | Behaviour | Reduced motion |
|---|---|---|
| Verified points | Count-up plus route stamp over ~700 ms, with `aria-live` text | Show final value immediately |
| Navigation | Native/fast route transition only; no page-wide reveals | No transition |
| Buttons/rows | 120–160 ms colour/transform response to input | No transform |
| QR refresh | Countdown ring; numeric text remains authoritative | Static numeric countdown |
| Loading | Skeletons matching final layout | Static skeletons |

No parallax, scroll-jacking, ambient animation, bouncing badges or urgency countdowns.

## 10. Accessibility floor

- WCAG 2.2 AA; visible focus on every interactive element.
- Semantic landmarks, skip link, one clear `h1`, logical heading order.
- `aria-live="polite"` for scan results, points and async confirmations.
- Forms use labelled fields with inline, actionable errors and `aria-invalid`.
- Camera flows always provide manual search/check-in or text-code alternatives.
- Comfort settings — larger text, high contrast, reduce motion — are profile-backed and applied at root.
- Dialogs, sheets and drawers have required titles; icon-only controls have accessible names.
- Charts have summaries and equivalent data tables.

## 11. Generic-default review

Checked and rejected:

- Cream background + serif display + terracotta accent
- Near-black background + single acid accent
- Broadsheet hairline layout
- Tracked ALL-CAPS eyebrows
- Middle-dot metadata strings and spaced em-dash labels
- Arrows appended to button labels
- Accenting one word in a headline
- Grids of identical rounded cards
- Gradient washes and oversized empty hero
- Generic Geist/Inter default typography

Approved distinctive system: Bricolage + Atkinson, Embun/Tinta civic palette, route-line motif, noticeboard list rows, event-pass QR treatment, transit-sequence timelines and restrained stamp animation.

## 12. Implementation mapping

- Token names remain in `packages/ui/src/styles/globals.css`.
- Fonts load in `apps/web/app/layout.tsx` through `next/font`.
- Reusable route-line, township-line and points-stamp components live in `apps/web/components/shared`.
- Resident and admin shells live in route groups under `apps/web/app`.
- All copy is centralized in `apps/web/content`.
- Screenshots are reviewed at 390 px and 1280 px before each phase checkpoint.
```
