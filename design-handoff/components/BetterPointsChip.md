# BetterPointsChip

The resident's BetterPoints balance as a `sun` pill, shown in the tablet and desktop header from the `sm` breakpoint up.

**Consumer provides:** the balance (number) and, for the earned variant, the delta.

- Default: `sun` fill, `ink` text, `numeric` style with tabular numerals and thousands separators.
- `earned`: `sun-tint` fill for "+20" deltas in activity rows and confirmations.
- Hidden in the mobile header to save space; the balance lives on the Impact tab there.
- Give it an accessible name that spells out "BetterPoints".

Don't use `sun` for anything else in the same header.
