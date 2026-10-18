# Load-time improvements — 18 October 2026

## Implementation

- Borrow and Events start independent catalogue/list queries together.
- Session context reads memberships, profile and points together after user verification. The navigation unread count runs alongside those reads. React request memoization shares verification; balances remain fresh and are matched to the selected township.
- The auth proxy uses verified claims and excludes public brand/demo artwork and the service worker. Protected responses retain `private, no-store`; server-side user and membership checks remain in place.
- Home streams tasks, nearby activity, saved items, recycling impact and the township goal behind separate Suspense boundaries. The feed requests one record per displayed card and embeds the event attendance count in the event query.
- Server Supabase reads of item categories, event categories, levels, badge definitions, recycling materials and recycling units opt into the Next Data Cache for 3,600 seconds. Cache keys retain URL/query parameters and all request headers, including Authorization, so entries are scoped to credentials. Errors are not persisted by Next; writes, auth calls, RPCs and resident tables are excluded. Explicit `no-store` and zero revalidation are respected.
- Saving a badge definition expires its cache tag immediately. Future editors for reference tables must also invalidate their tags; edits to nested recycling units must invalidate `reference:recycling_materials` as well as `reference:recycling_units`.
- Rewards reuses the session points result and uses a caller-scoped aggregate RPC for activity totals and estimated value. Counts no longer stop at 1,000 ledger rows.
- Borrowing/lending/item histories are scoped to the selected township, load 20 records per tab, preserve independent page parameters and use one trust RPC for the displayed incoming requests.
- Public Storage raster images use responsive Next image resizing. SVGs, local previews, signed/private URLs and unrelated external images retain direct delivery. The optimizer permits only the configured Storage origin and public-object path, with no redirects. Loopback access is enabled only for a configured local Supabase instance.
- Maps mount within 200 px of the viewport. Realtime subscriptions sharing a router coalesce events into one refresh per 200 ms window.
- Catalogue cards and primary navigation prefetch on pointer intent or keyboard focus, avoiding automatic authenticated prefetch requests for every visible link during initial loading.

## Database rollout

`supabase/migrations/20261018000000_performance_queries.sql` adds two caller-scoped RPCs and indexes for unread notifications, visible item ordering and personal histories. It was applied to the local database without resetting demo data, and database types were regenerated.

Apply the migration to hosted Supabase before deploying this application version. No hosted database or deployment was changed during this work. Review any other pending migrations before a remote push.

## Verification

- Production Next.js build, TypeScript and ESLint.
- 168 app tests, including proxy matching/cookie forwarding, reference-cache boundaries and invalidation, selected-township points, Home partial failures, deferred maps, intent prefetch and realtime batching.
- 309 database assertions across 19 transactional test files, including counts beyond 1,000 entries, caller isolation and trust permissions. No database reset was used.
- Browser checks of Home, Borrow, Events, Rewards and borrowing/lending at 1440 px and 390 px. No page exceptions, horizontal overflow, broken loaded images or section retry states were found. The Events map was absent before scrolling and mounted afterward.
- A public Storage image returned HTTP 200 from the image optimizer; a signed-out protected page still redirected with `private, no-store`, while public artwork used normal static response headers.

## Measurements

Measurements use production builds against local Supabase. Both versions share the same database and indexes. They do not establish hosted or mobile-network performance. Raw local browser/HTTP samples and screenshots are in the ignored `output/playwright/` directory.

The original build was preserved separately. Requests alternate between versions, with the first round excluded as warm-up and medians calculated from six measured rounds. Server-only requests exclude browser hydration, asset downloads and speculative route prefetches. Browser runs separately include those costs.

Final browser samples use separate desktop browser contexts for the two versions, allow pending network work to settle between navigations, and alternate versions each round. Times are measured from navigation start.

| Route | Response start before → after | Load event before → after | Automatic prefetches before → after |
| --- | ---: | ---: | ---: |
| `/home` | 158 → 106 ms | 211 → 171 ms | 26 → 12 |
| `/borrow` | 138 → 95 ms | 198 → 139 ms | 40 → 2 |
| `/events` | 151 → 102 ms | 211 → 154 ms | 35 → 2 |
| `/rewards` | 160 → 100 ms | 237 → 165 ms | 22 → 2 |
| `/borrow/mine` | 170 → 112 ms | 224 → 167 ms | 26 → 8 |

The median load event improved by about 19–30% on these five routes. These are small local samples, not a production speed guarantee. HTML response size increased slightly from additional streaming/component boundaries. Rewards LCP was higher in this run (254 → 492 ms), despite its earlier first paint and load event; do not interpret the table as proof that every Web Vital improved. Hosted mobile LCP still needs verification.

## Earlier development snapshot

Measured locally on a headless Chromium desktop/mobile emulation against the seeded local Supabase environment. These are development-environment measurements, not production Lighthouse scores.

| Surface | Measurement |
| --- | --- |
| Resident Home, 390 × 844 | FCP ≈ 256 ms; LCP ≈ 256 ms; load event ≈ 812 ms |
| Township Pulse, 1280 × 900 | load event ≈ 536 ms |

Targets:

- Home LCP under 2.5 s on a mid-range phone profile: met in this local measurement.
- Township Pulse under 2 s on seeded data: met in this local measurement.

Production verification should repeat these measurements on the deployed Vercel region and record the result honestly.
