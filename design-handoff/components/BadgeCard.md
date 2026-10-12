# BadgeCard

Award tile with a 1:1 icon area and a short label; the description appears on desktop hover.

**Consumer provides:** the badge `icon`, name, `description` and whether it is earned. Badges come from the `badges` table; admins manage them at `/admin/badges`. Lives at `apps/web/components/rewards/badge-card.tsx`.

- Keep the label to one or two words. The description reveals on hover and focus, and is always available to screen readers.
- Locked badges use a `ground` tile, a dashed `ink-muted` outline and a muted label, never a greyed copy of the earned art.
