# Option C — component specs

Build each one in `packages/ui` (shared primitives) or `apps/web/components/block/` (app-specific). Exact spacing and colours are in `screens/*.html`. Token names refer to `design-tokens/tokens.css`.

---

## Layout

### `LimeScreen` + `Sheet`
The signature layout. The top of the screen sits on `lime` (or `sky` on item detail, `ink` on the ticket). A white `Sheet` with `radius-sheet` top corners holds the content below, overlapping the hero by 24px on item detail.
- **Props:** `ground: 'lime' | 'sky' | 'ink'`, `children`.
- Reserve 110px bottom padding so content clears the floating dock.

### `FloatingDock` (main nav)
A floating `ink` pill, 16px from the screen edges and 18px from the bottom (plus the safe-area inset), with `shadow-dock` and `radius-dock`. Four tabs: **Block, Borrow, Events, Impact**, each with an icon and a label.
- **Active tab:** `lime` fill, `ink` label and heavier icon. **Inactive:** white.
- On `ink` screens the dock switches to `ink-raised` so it stays visible.
- Tabs are 56px tall; use `aria-current="page"`.
- **Desktop (not designed yet):** turn it into a left rail with the same active treatment.

### `ActionDock`
Same shape and position as `FloatingDock`, but it replaces the nav on detail screens. It shows a summary on the left (the chosen dates and the price) and one `tomato` primary button on the right.
- **Props:** `title`, `subtitle`, `actionLabel`, `onAction`, `disabled`.

---

## Home

### `PointsRingChip`
An `ink` pill in the header with a small progress ring and the balance ("1,240 BP"). Links to Impact.
- **Props:** `balance`, `progressToNextLevel` (0–1).
- Accessible name: "1,240 BetterPoints, see your impact".

### `IntentComposer` ← the core idea of Option C
1. A two-option segmented control: **"I need…" / "I can offer…"** (an `ink` track with a `lime` selected pill). Use `role="tablist"` with real tabs.
2. An input on white with a 2px `ink` ring, and a 44px `tomato` send button (`aria-label="Ask the block"`).
3. Suggestion chips (outlined in `ink`) that fill the input when tapped.

**Behaviour:**
- **Submitting "I need"** searches items and open offers first. With no match, it offers to post a help request (`help_requests`).
- **Submitting "I can offer"** starts a prefilled `/borrow/new` listing, or a help offer.
- Suggestions come from popular searches in the township, never from another resident's history.

### `PillarTag`
A small uppercase tag in its pillar's colour: PINJAM = `sky`, JOM = `lime`, TOLONG = `mustard`. Text is always `ink`. Never use colour alone to tell pillars apart: the word is always shown.

### `FeedCard`
A row card with a 66×88 thumbnail (3:4), a `PillarTag`, a title and a meta line. One component, three variants:
- **item:** `paper` card, illustration or photo thumbnail. Meta: lender · walking time · availability.
- **event:** an inverted `ink` card with a `tomato` date block (day, date, month) instead of an image, so events stand out in the mixed feed. Meta: time · number going · BP.
- **help:** `paper` card with a `mustard` icon block. Meta: shared place · time needed · when.

**Data:** a single mixed "Near you, right now" query, ordered by soonest and closest. Walking time is estimated between neighbourhoods/facilities, never from a home address.

---

## Item & handover

### `ItemHero`
A full-bleed `sky` area, 270px tall, holding the item image, a back button and a save button (44px white circles).

### `LenderRow`
Avatar initial, "Name · Blok", and a trust line ("Lent 14 times, all returned on time") based on completed bookings. No star ratings.

### `DayRangePicker`
A horizontal strip of day chips (64px tall).
- **Unavailable:** struck through, disabled, with an `aria-label` that says why.
- **Selected range:** `ink` fill with `lime` text. The ends are rounded on the outside and square where they join.
- **Props:** `days[]`, `blocked[]`, `value: {start, end}`, `onChange`. Keyboard: arrow keys move between days, Enter selects.

### `HandoverSpot`
A `paper` row with a pin icon: "Hand over at Blok C lobby · 2 min walk · a shared space, never a home address". Facilities only.

### `HandoverSteps`
A three-step vertical tracker: request/approve → both confirm pick-up → both confirm return.
- The current step is a `tomato` circle; future steps are `hairline`.
- Reuse it on `/borrow/bookings/[id]` as the live status, with ✓ marks on completed steps.

---

## Event

### `TicketPass`
After someone signs up, the event page becomes this ticket.
- **Top half (`tomato`):** pillar line, title, then Date / Time / Earn in three columns.
- **Middle:** a perforation — circular notches in the screen colour and a dashed `ink` line.
- **Bottom half (`lime`):** the QR code on white, plus "Show this at the gate".
- Generate the QR from the RSVP token. The placeholder in the mockup is not a real QR code.
- Below the ticket: Directions and Add-to-calendar buttons (`ink-raised`), a details card, and a `mustard` "Want to volunteer instead?" card.
- **Before sign-up**, the same page shows the event details with a `tomato` "I'm going" button in the `ActionDock` (not mocked up).

---

## Impact

### `ProgressRing`
A 112px ring: `lime-track` background, `ink` progress, "Lv 3" in the centre. Use `role="img"` with a label giving the percentage.

### `StatTile`
A small `ink` tile with a big number in the display font and a short label (things lent, events joined, hours helping).

### `BlockGoalCard` ← new feature
A `sky` card for a shared monthly goal for the resident's block.
- **Props:** `goalLabel`, `target`, `current`, `mine`, `daysLeft`, `bonusBp`.
- The progress bar shows the block's total in `ink` and the resident's own share in `tomato`, with a legend.
- Show aggregate counts only. Never list who contributed.

### `RewardCard` (horizontal scroller)
A 200px-wide card in `mustard` (affordable) or `paper` (not yet affordable). Partner tag, title in the display font, and a full-width button: "Redeem · 300 BP", or a disabled "160 BP to go".
