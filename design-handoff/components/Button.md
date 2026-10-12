# Button

Pill-shaped action button with a clear verb label and a stable 44px height.

**Consumer provides:** the label (a verb phrase naming the action), the variant and the handler.

- `primary` — `coral` fill, `ink` text. One per view region: the action that moves the resident forward ("Request to borrow", "Register as volunteer", "Redeem").
- `secondary` — `surface` with an `ink-muted` inset edge, for the second choice.
- `ghost` — text only, for Cancel and low-stakes actions.
- `on-ink` — white pill on `ink` bands and status pages.
- Disabled uses `border` fill and `ink-muted` text, and the label says why ("Fully booked").

Do: keep width stable when the label changes state (use a min-width). Don't: white text on coral (2.8:1), icon-only primary actions, more than one coral button side by side.
