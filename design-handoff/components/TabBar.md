# TabBar

Fixed bottom navigation on mobile with four labelled tabs: Home, Borrow, Events, Impact.

**Consumer provides:** the current route, to set `aria-current="page"` on the matching tab.

- Every tab shows an icon and a text label; never icon-only.
- The active tab gets a `lilac-tint` fill, `ink` label and a heavier icon stroke. Inactive tabs are `ink-muted`.
- Includes bottom safe-area padding. Must fit 320px with no horizontal scroll.
- Replaced by `Sidebar` from the tablet breakpoint up.
