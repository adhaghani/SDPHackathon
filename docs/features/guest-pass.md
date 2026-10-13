# BorrowLah Guest Access QR — audit and implementation plan

**Status:** Plan approved and implemented. Verification evidence is recorded in the final report.

## 0. Scope and review gate

This plan implements the supplied Guest Access QR specification. It follows the repository constraints in `design-handoff/HANDOFF.md` and `docs/features/feature-pack-v2.md`:

- no new infrastructure;
- no npm dependency additions without approval;
- RLS on every new table;
- integrity-critical writes through `SECURITY DEFINER` RPCs;
- admin output through aggregate-only RPCs with `k = 5`;
- opaque/pass tokens handled like existing handover tokens: signed/constant-time verification, no raw-token logging;
- ink text on lime, tomato, sky and mustard;
- no horizontal scrolling at 320px;
- explicit empty, loading and error states;
- no BetterPoints for guest-pass activity.

The supplied document says `docs/design-handoff/HANDOFF.md`; in this checkout the authoritative file is `design-handoff/HANDOFF.md`. The feature-pack document is present at `docs/features/feature-pack-v2.md`.

---

## 1. Repository audit

### 1.1 Roles today and where a guard fits

Current role model:

- `township_members.role` is constrained to `resident`, `organiser`, or `township_admin`.
- Every membership is scoped by `township_id`; the selected township is carried by the `selected_township_id` cookie.
- `join_township()` inserts memberships with the table default `resident`. There is no role parameter, so residents cannot self-assign privileged roles.
- `approve_member()` changes only `status`; it does not change role.
- The admin Members screen currently approves or rejects pending memberships but has no role-assignment control.
- Route checks are explicit. Admin pages require `membership.role === "township_admin"`; general app pages require an active membership through `requireActiveMember()`.

**Guard fit:** add a fourth membership role, `guard`, scoped to exactly one `township_members` row. A guard is an active township member assigned by an organiser or admin; guards never receive the role through join, signup, or self-service UI.

Planned authorization model:

- `is_township_guard(township_id)` — active `guard` membership.
- `is_guest_gate_operator(township_id)` — active `guard` only for `/guard` reads and scans.
- `is_guest_pass_assigner(township_id)` — active `organiser` or `township_admin`.
- `is_township_admin(township_id)` continues to govern admin aggregate views and settings.
- `/guests` requires an active `resident`, `organiser`, or `township_admin` membership; guards are redirected to `/guard`.
- `/guard` requires an active `guard` membership; other roles are redirected to `/home`.
- Admin guard assignment is an RPC, not direct table mutation.

Guard assignment must not demote an admin unless performed by an admin. Organisers may assign or remove the `guard` role only for eligible resident/organiser memberships in their own township.

### 1.2 Township, home and unit storage

- `township_members.township_id` identifies township membership.
- `township_members.neighbourhood_id` identifies the neighbourhood.
- `township_members.unit_label` is the resident's home/unit label.
- `profiles.display_name` contains the resident's display name.
- The privacy rules in `docs/PRIVACY_AND_SAFETY.md` say unit labels are private to the member and township admins.

Guest-pass access rules derived from this storage:

- Public visitors may receive only the township display name and gate names.
- Residents see their own unit and their own passes/logs.
- Guards receive a host display name and destination unit only in a gate result after a valid scan or approved walk-in lookup.
- Admins receive no visitor name, phone, plate, unit, host name or individual log.
- The unit never appears in the public pass page, QR URL, notification body, share text, aggregate view, or resident-created share payload.

### 1.3 Existing QR, scanner and offline handover to reuse

Existing implementation:

- Event tickets use `qrcode.react` and short-lived HS256 tokens in `apps/web/lib/qr.ts` / `qr-core.ts`.
- Camera scanning uses the already-installed `@yudiel/react-qr-scanner`.
- Handover tokens use a random `jti`, HMAC-SHA256 signature, expiry, database registration and consumption, and constant-time signature comparison in `apps/web/lib/handover-token.ts`.
- `apps/web/actions/handover.ts` verifies the token before calling `consume_booking_handover_token`.
- `apps/web/lib/offline-queue.ts` is an IndexedDB queue in the `borrowlah-offline` database.
- `apps/web/components/borrow/offline-handover-sync.tsx` replays queued scans and reports success/failure.
- `apps/web/public/sw.js` currently caches only booking-handover navigations and static assets.

Reuse decisions:

- Reuse `qrcode.react`, the existing scanner, HMAC/constant-time patterns, IndexedDB queue patterns, manual-entry fallback, server-side revalidation and generic public error responses.
- Do not add dependencies.
- Guest QRs are not 60/90-second event tickets. Generate a 128-bit random component, sign it with the existing server secret pattern, include the pass ID and validity expiry, and store only SHA-256 of the complete QR token.
- The service worker must be extended for `/pass/*`; this does not exist today.
- The existing offline queue stores raw handover tokens until sync. Guest scans may temporarily store the opaque token in the queue for replay, but it must never be written to application logs, notifications, analytics or error messages.

### 1.4 Existing operational constraints

- `pg_cron` is optional. The repository has an optional `pg_cron` extension block but no existing `cron.schedule()` registration.
- `public.run_scheduled_jobs()` already exists as a `SECURITY DEFINER` function granted only to `service_role`.
- Township settings already exist as `townships.settings JSONB`; they are currently unused by the app and are suitable for guest-pass limits/retention.
- Realtime is optional and gated by `NEXT_PUBLIC_ENABLE_REALTIME`; `RealtimeRefresh` already listens to notifications, booking messages and points. Walk-in approval must have a polling fallback when Realtime is disabled.
- There is no general IP/device rate-limit service. Token/short-code limits must use the existing database and Next.js route handler only.

---

## 2. Proposed data model

Create one new migration after the latest migration, named using the repository's timestamp convention, for example:

`supabase/migrations/20261014000000_guest_passes.sql`

All new tables enable RLS. Direct writes go through `SECURITY DEFINER` functions. Direct table grants are minimized; reads use narrow RPCs when a single table would otherwise expose fields to the wrong role.

### 2.1 `gates`

```sql
id              uuid primary key
township_id     uuid not null references townships on delete cascade
name            text not null
created_at      timestamptz not null default now()
unique (township_id, lower(name))
```

RLS: active members may read gates in their selected township; only admin/organiser gate-management RPCs may mutate them.

### 2.2 `visitor_passes`

Required fields:

```sql
id, host_id, township_id
visitor_name
visitor_phone                 -- optional
vehicle_plate                 -- optional, stored uppercase without spaces
purpose                       -- optional, max 80
valid_from, valid_until
max_entries                   -- default 1, > 0
entries_used                  -- default 0, >= 0
status                        -- active | revoked | expired | completed
token_hash                    -- SHA-256 bytes, unique, never the raw token
created_at, revoked_at
```

Implementation additions required by the specification:

- `short_code_hash` — SHA-256 bytes for the printed 8-character fallback; unique.
- `source` — `resident` or `walk_in`; walk-ins are created only after host approval if represented here.
- `mute_checkout_notifications` boolean default `false`.
- Optional `ended_at` / `completed_at` for deterministic retention and average-stay calculations.
- Indexes on `(township_id, valid_from, valid_until)`, `(host_id, created_at desc)` and unique hashes.
- No `unit_label` column: the destination unit is joined from the host's membership at guard read time.

Stored `status` distinguishes `active` and `revoked`. Effective status is computed on every read:

- `revoked` when revoked;
- `expired` when not revoked and `now > valid_until` while outside;
- `completed` when not revoked, outside, and `entries_used >= max_entries`;
- otherwise `active`.

If the literal four-value column is retained, expired/completed values are derived/output fields rather than trusted stored state.

Inside/outside is always derived from the latest **applied** `visitor_logs` row: `in` without a later `out` means inside.

### 2.3 `visitor_logs`

Required fields:

```sql
id, pass_id, township_id, gate_id, guard_id
direction                     -- in | out
scanned_at                    -- original device time
synced_at
id_sighted boolean
note
```

Implementation additions required for offline correctness:

- `client_event_id uuid` — generated by the device and globally unique for idempotent replay.
- `sync_status` — `pending`, `applied`, `needs_review`, or `rejected`.
- `review_reason` — for example `revoked_while_offline` or `expired_while_offline`.
- `applied boolean` — state-changing logs are `true`; flagged offline conflicts are retained but do not change inside/outside state.
- `created_at`.

Constraints:

- `direction in ('in','out')`;
- `scanned_at` bounded to a sensible clock-skew window;
- unique `client_event_id`;
- mutual integrity between pass/walk-in references if walk-ins share this table.

Rejected scans are not silently dropped. Server revalidation records an auditable review outcome without leaking the raw token.

### 2.4 `walk_in_requests`

Walk-ins have no pass and need explicit host approval.

```sql
id, township_id, gate_id, guard_id
host_member_id
visitor_name, vehicle_plate
status -- pending | approved | denied | timed_out | manual_follow_up
requested_at, responded_at, responded_by
outcome_note
```

Implementation additions:

- `client_request_id` for idempotency.
- Optional `entry_log_id`/`exit_log_id` after approval.
- RLS: guards in the township read their gate's requests; hosts read requests where they are the host; admins receive aggregates only.

The guard chooses the host by destination unit through a narrow lookup RPC. The host receives an Approve/Deny notification. The guard sees the response through Realtime when available and a polling refresh otherwise. After five minutes, the UI marks the request for the township's manual procedure and records the outcome.

### 2.5 Attempt/rate-limit storage

Add a small `guest_access_attempts` table or use a dedicated section in a generic attempt table:

- scope: `token_lookup`, `short_code`, `pass_create`;
- subject: HMAC/SHA-256 of IP or device identifier;
- fixed window start;
- attempts;
- locked_until;
- no raw IP, token, short code or visitor data.

Cleanup is part of guest-pass maintenance.

### 2.6 Township settings

Store configuration under `townships.settings -> 'guest_pass'`:

```json
{
  "max_validity_days": 7,
  "max_active_passes_per_resident": 10,
  "max_days_ahead": 30,
  "max_creates_per_resident_per_day": 20,
  "retention_days": 90,
  "overstay_grace_minutes": 30,
  "walk_in_timeout_minutes": 5,
  "short_code_max_attempts_per_minute": 5
}
```

Server validation uses these values, not client-visible hidden inputs. Admin edits go through one RPC with validation and `audit_log`.

---

## 3. Token and lookup security

### 3.1 Resident-created QR token

1. Generate 16 cryptographically random bytes.
2. Build a guest-pass token using the same structural pattern as the handover token: token type, pass ID, random ID, issued-at and `valid_until` expiry.
3. Sign it with the existing `CHECKIN_SIGNING_SECRET`/`getSecretKey()` HMAC pattern.
4. Return the opaque token to the resident exactly once for sharing/QR rendering.
5. Store only SHA-256 of the complete token in `visitor_passes.token_hash`.
6. Generate a separate random 8-character short code, store only its hash.
7. QR content is `/pass/<opaque-token>`; the short code is printed below it.

The raw token is never included in SQL errors, server actions' returned messages, notification bodies, analytics, `console.log`, Sentry/error context, or URLs other than the intentionally opaque `/pass/<token>` route.

### 3.2 Public resolution

Implement an anonymous-safe route handler/RPC path for `/pass/[token]`:

- hash the supplied token in the server process;
- compare hashes/signatures in constant time;
- use a dummy hash comparison when no row exists so invalid and nonexistent responses are indistinguishable;
- apply per-IP lookup limiting before expensive work;
- return generic `invalid` for unknown, malformed and mismatched tokens;
- after a successful match, return revoked/expired-specific states as required;
- return only visitor name, validity, township display name, gate names and effective status;
- never return host ID, full host name, unit, phone or plate to the visitor;
- set `Cache-Control: private, no-store` for authenticated/PII responses. The service worker may cache a successful public pass shell only after the first online visit.

Short-code resolution uses the same generic response. After five wrong attempts per hashed device identifier in one minute, lock that device for the remainder of the window with a generic response.

### 3.3 Token/short-code rate limits

- Pass creation: max 20 per resident per rolling UTC/calendar day, enforced transactionally with an advisory lock and a database count.
- Token lookups: atomic database counter keyed by hashed IP and fixed minute window.
- Short-code guesses: atomic database counter keyed by hashed device ID; lock after five wrong attempts per minute.
- Guard scans: authenticated and scoped to one township; no public enumeration.
- Tests must prove raw tokens and short codes are absent from audit logs and application logs.

---

## 4. Resident flow — `/guests`

### 4.1 Page and navigation

- Add `Guest passes` to resident/organiser/admin sidebar navigation and expose it from Home only where appropriate.
- Protect `/guests` in `apps/web/proxy.ts`.
- Require an active non-guard membership in the page itself.
- Use the existing lime/white-sheet, floating-dock and shadcn form conventions.

### 4.2 Create pass

Form fields:

- visitor name;
- visit date/time window;
- single entry or multi-day;
- optional phone;
- optional plate;
- optional purpose;
- gate selection may be optional because a pass is township-wide; if omitted, the public page lists all township gates.

Use the new `Calendar`-based date/time fields rather than native date inputs.

Server-side validation:

- validity no longer than configured 7 days;
- no more than 10 active passes per resident;
- `valid_from` no more than 30 days ahead;
- `valid_until > valid_from`;
- max entries consistent with single/multi-entry choice;
- visitor name/purpose/phone/plate length and normalisation;
- 20 creates per resident per day.

On success return the opaque token once and render a dialog containing:

- large high-contrast QR;
- WhatsApp share link using `https://wa.me/?text=...`;
- copy-link action with a copied/error state;
- PNG download using `QRCodeCanvas` from the already-installed `qrcode.react`;
- printed 8-character short code;
- no unit or host full name.

### 4.3 Pass list

Use tabs: **Upcoming**, **Inside now**, **Past**.

Each row shows:

- effective status and plain-language reason;
- visitor display data permitted to the host;
- validity window;
- latest entry/exit times;
- Revoke action;
- optional Duplicate action.

Revocation uses an immediate `SECURITY DEFINER` RPC. It sets `revoked_at`/`status = revoked`, writes an audit row and makes the state effective at the next gate resolution without delay.

Duplicate creates a new pass/token/short code while respecting active/daily limits. It copies only visitor metadata and validity shape; it never reuses a consumed token.

Empty, loading and error states are required for every tab and action.

---

## 5. Public visitor page — `/pass/[token]`

Create `apps/web/app/pass/[token]/page.tsx` outside the authenticated `(app)` layout.

The page shows:

- a large QR with ink modules on white/lime;
- visitor name;
- validity window;
- “Visiting a resident in \<township name\>”;
- available gate names;
- short code;
- short privacy notice explaining entry/exit logging, access control purpose and the configured retention period.

It never shows:

- host full name;
- host unit;
- host phone;
- visitor phone/plate unless that visitor is the viewer? The public pass spec does not require either, so do not show them;
- admin/guard-only notes.

States:

- active: QR shown;
- revoked: clear revoked message and no QR;
- expired: clear expired message and no QR;
- completed: clear completed message and no QR;
- invalid: one generic invalid message;
- loading and network/error fallbacks.

Offline behavior:

- extend the service worker to fetch `/pass/*` network-first;
- cache only a successful response and its static assets;
- on reconnect, network-first refresh replaces stale active/revoked state;
- opening the page once while online makes it available offline;
- document that Cache Storage contains the opaque pass page on the visitor's device.

---

## 6. Guard flow — `/guard`

### 6.1 Access and shell

- Protect `/guard` in the proxy.
- Require an active `guard` role in the page.
- Mobile-first layout with large shadcn buttons, 44px minimum touch targets and no horizontal scroll at 320px.
- Remember the selected gate in device `localStorage`.
- Show online/offline state, queue count and last refresh.

### 6.2 Scanner and fallbacks

Reuse:

- `@yudiel/react-qr-scanner` camera scanner;
- manual QR token entry;
- 8-character short-code entry;
- plate search for a limited township-wide active pass directory.

Fallback order:

1. scan QR;
2. enter short code;
3. search by normalised plate;
4. no result/ambiguous result shows a generic invalid state.

### 6.3 Result card

Online, narrow guard RPC output contains:

- valid/invalid plus reason:
  - expired;
  - revoked;
  - not started yet;
  - entries used up;
  - wrong township;
  - invalid;
- visitor name;
- plate;
- validity;
- host display name;
- destination unit — only here;
- current inside/outside state;
- latest entry/exit time.

Actions:

- **Check in** with an `ID sighted` checkbox; the boolean is stored, never an ID number.
- **Check out** when currently inside.
- Double check-in is blocked atomically.
- Check-out remains allowed after expiry when the visitor is inside.
- Check-in is rejected outside validity, after entry capacity or after revocation.

The RPC validates township, gate, guard role, current status, direction and entry capacity in one transaction.

### 6.4 Inside now and today's log

- `Inside now` lists active township visitors sorted by time in.
- Overstays past `valid_until + configured grace` use `bg-tomato`/`bg-coral-tint` with ink text and a visible **Overstay** word label.
- `Today's log` lists entries/exits with gate, direction and original scan time.
- Both views are empty/loading/error safe.
- They expose only fields needed at the gate and never list other townships.

### 6.5 Walk-ins

Flow:

1. Guard enters visitor name and optional plate.
2. Guard selects destination unit through a narrow host lookup.
3. Server creates a pending `walk_in_requests` row and notifies the host.
4. Host sees Approve/Deny in notifications/`/guests`.
5. Guard page receives the response through Realtime when enabled; otherwise polls at a modest interval.
6. After five minutes, show the manual-procedure state and allow the guard to record the outcome.
7. Approved walk-ins receive a check-in action using the same inside-state rules; denied/timed-out requests cannot check in without an explicit new/manual approval.

---

## 7. Notifications

Use the existing `notifications` table and `NotificationBell`.

Insert notifications from the same transaction as the state change:

- check-in: `"<Visitor first name> checked in at <gate>, <time>"`;
- check-out: corresponding message;
- overstay: once per pass, 30 minutes after `valid_until` while still inside;
- walk-in approval request with Approve/Deny link.

Rules:

- links point to `/guests/<pass_id>` or `/guests?walkIn=<id>`;
- notification bodies never contain a unit or token;
- notification inserts use stable `dedupe_key` values to prevent duplicates;
- checkout notifications can be muted per pass using `mute_checkout_notifications`;
- check-in and overstay are not muted by that field;
- offline check-ins/check-outs notify the host after sync using the original device time;
- no points ledger insert is made.

Realtime notification refresh is optional; polling/manual refresh remains functional.

---

## 8. Offline guardhouse

### 8.1 IndexedDB cache

Extend the existing `borrowlah-offline` database with new stores rather than creating another database:

- `guest-pass-cache` keyed by pass ID;
- `guest-scan-queue` keyed by `client_event_id`.

Cached today/tomorrow active passes contain only:

- pass ID;
- token hash;
- visitor name;
- plate;
- validity;
- host unit;
- effective status;
- refreshed_at.

Refresh:

- every five minutes while `/guard` is open;
- on `window.online`;
- on guard sign-in/gate change.

Wipe `guest-pass-cache` and `guest-scan-queue` on logout, and clear any persisted gate/plate search state. The existing handover queue remains separate.

### 8.2 Offline scan

- Hash the scanned opaque token in the browser with Web Crypto.
- Match against cached `token_hash`.
- Validate direction/state against cached pass data.
- Show clear expired/revoked/not-started/used-up/invalid states from cache.
- For a valid check-in/out, enqueue:
  - raw opaque token needed for server signature replay;
  - `client_event_id`;
  - direction;
  - original `scanned_at`;
  - gate ID;
  - `id_sighted`;
  - optional note;
  - cached pass ID.
- Show **“Saved offline, will sync”**.
- Never display or log the raw token in UI/error text.

### 8.3 Sync

A server action/route re-validates every queued scan:

- verify signature/expiry and hash in constant time;
- verify guard membership, township and gate;
- recompute current pass status and revocation state;
- reject duplicate `client_event_id`;
- use an atomic transaction for direction/capacity;
- if revocation/expiry occurred after the offline scan:
  - retain the log;
  - mark `needs_review`/`applied = false`;
  - do not change current inside state;
  - expose the flagged row to admin/guard review as required;
- apply valid scans with original `scanned_at`;
- send host notifications only after successful sync;
- remove queued items only after an explicit applied/reviewed response;
- keep permanent failures visible for manual resolution.

---

## 9. Admin aggregates and settings

Create a `SECURITY DEFINER` function such as:

`guest_pass_stats(p_township_id, p_from, p_to)`

It is executable only by an authenticated admin for the matching township and returns aggregates only:

- visitors per day and week;
- peak hours;
- average stay length;
- overstay count;
- passes per gate;
- walk-in approval rate.

Privacy/k = 5 rules:

- no individual rows, names, phones, plates, units, hosts, guard names or raw tokens;
- suppress any grouped result with fewer than five distinct relevant visitors/pass subjects;
- return `suppressed: true` and aggregate suppressed counts rather than exact small values;
- average stay and walk-in approval rate return null when the denominator is below five;
- peak hour/gate/day buckets below five are suppressed;
- tests must attempt to obtain PII through the RPC and fail if present.

Add admin UI under Township Pulse (or a dedicated Guest access section linked from it) for:

- gate CRUD;
- guard role assignment/removal;
- limits and retention settings;
- aggregate visitor metrics;
- review-flagged offline logs;
- manual retention purge trigger.

Guard role assignment uses an RPC checked with `is_guest_pass_assigner`. Admin settings use `townships.settings` with validation and `audit_log`.

---

## 10. Retention and privacy

Default retention: **90 days after a pass ends**, configurable 30–365 days.

`purge_guest_personal_data()`:

- finds passes whose effective end/revocation/completion is older than the configured retention;
- deletes/nulls visitor name, phone, plate, purpose, token hash and short-code hash;
- removes walk-in personal data;
- preserves anonymised `visitor_logs` rows, direction, duration buckets, gate/township and outcome for statistics;
- preserves IDs needed for aggregate joins but no identity data;
- deletes attempt rows beyond a short security window;
- is idempotent, bounded and writes an audit summary rather than PII.

Execution strategy:

- if `pg_cron` and `cron.job` are available, schedule maintenance through the existing database job pattern;
- otherwise invoke the same bounded function lazily after successful admin and guard reads;
- integrate guest maintenance into `run_scheduled_jobs()` when it is invoked by service role;
- do not depend on cron being available.

Document this on `/admin/methodology` and in the public privacy notice.

---

## 11. Application file plan

No new npm packages are expected.

### Database and security

- `supabase/migrations/<timestamp>_guest_passes.sql`
  - role constraint update;
  - new tables, indexes, RLS, grants;
  - token/short-code hashing helpers;
  - status/inside-state helpers;
  - resident/guard/public/admin RPCs;
  - rate limits;
  - notifications;
  - retention and aggregate functions;
  - optional pg_cron registration.

### Shared helpers

- `apps/web/lib/guest-pass.ts`
  - pure token creation/verification and generic error mapping;
  - reuses HMAC/constant-time handover patterns.
- `apps/web/lib/guest-offline.ts`
  - cache refresh, scan queue and logout wipe;
  - extends the existing IndexedDB conventions without changing handover queue behavior.
- `apps/web/lib/guest-pass-settings.ts`
  - server-only validation/defaults for township settings.

### Server actions/routes

- `apps/web/actions/guest-pass.ts`
  - create, revoke, duplicate, resident list;
  - check-in/out, walk-in create/respond;
  - guarded by role and validated with Zod.
- `apps/web/app/api/pass/resolve/route.ts`
  - anonymous token/short-code resolution and IP/device limits;
  - generic errors and no raw-token logging.
- `apps/web/app/api/guest-passes/sync/route.ts` or a server action
  - idempotent offline replay.

### Resident UI

- `apps/web/app/(app)/guests/page.tsx`
- `apps/web/components/guests/create-guest-pass-dialog.tsx`
- `apps/web/components/guests/guest-pass-list.tsx`
- `apps/web/components/guests/guest-pass-qr.tsx`
- `apps/web/components/guests/guest-pass-actions.tsx`
- walk-in host approval UI.

### Public UI

- `apps/web/app/pass/[token]/page.tsx`
- `apps/web/components/pass/public-pass.tsx`
- generic invalid/revoked/expired/loading states.

### Guard UI

- `apps/web/app/(app)/guard/page.tsx`
- gate picker, scanner, manual/short-code/plate fallback;
- result card, inside list, today log and walk-in form;
- polling fallback for approval responses.

### Admin UI

- gate/guard/settings controls;
- aggregate guest metrics;
- flagged offline log review;
- retention/methodology copy.

### Navigation, proxy, PWA

- add guest/guard/admin navigation by role;
- protect `/guests` and `/guard`, leave `/pass` public;
- extend service-worker network-first caching for `/pass/*`;
- cache/wipe guard pass data and scan queue;
- add guest routes to responsive and accessibility checks.

### Seed and tests

- seed gates, a guard membership, resident passes, logs and walk-ins;
- ensure reseed is idempotent and labels sample fixtures without adding any prohibited sample-data labels.

---

## 12. Test plan

### SQL / pgTAP

New `supabase/tests/guest_pass_test.sql` (or equivalent repository convention):

- resident cannot select another resident's pass;
- resident cannot create beyond active/daily/time-window limits;
- guard cannot read another township's passes/logs/gates;
- guard cannot check in a wrong-township token;
- admin direct access cannot expose visitor PII;
- admin aggregate RPC exposes aggregates only and applies `k = 5`;
- public resolver returns no unit/host full name/phone;
- invalid and nonexistent tokens return the same generic response;
- constant-time hash/signature paths;
- revoke blocks immediate check-in;
- check-out after expiry succeeds;
- double check-in fails;
- last entry becomes completed only after checkout;
- offline revocation conflict is retained as `needs_review`;
- duplicate `client_event_id` is rejected idempotently;
- notifications and checkout mute behavior;
- walk-in approval/deny/timeout;
- short-code/device lock after five guesses;
- creation limit 20/day;
- retention purge removes personal fields but preserves anonymised logs;
- no points-ledger row is created.

### Vitest

- token format and HMAC verification;
- generic error mapping;
- pass status/state calculations;
- validation limits/settings;
- plate normalisation;
- queue serialisation and review outcomes;
- notification copy and links;
- no raw-token logging.

### Playwright

Routes/roles:

- resident `/guests`;
- public `/pass/[token]`;
- guard `/guard`;
- admin guest aggregate/settings view.

Flows:

- create → share/copy/download → view → revoke;
- duplicate;
- online scan check-in/check-out;
- invalid/expired/revoked/not-started/used-up/wrong-township states;
- walk-in approve and deny;
- offline scan → reconnect sync → notification;
- logout cache wipe;
- no unit/host full name on public page;
- empty/loading/error states;
- 320, 390, 768 and 1440px with no horizontal overflow;
- Axe WCAG A/AA checks for new routes.

### Full gates before completion

```bash
npm run lint --workspace web
npm run typecheck --workspace web
npm run test --workspace web
npm run test:db
npm run build --workspace web
npm run test:e2e --workspace web
```

---

## 13. Delivery phases

1. **Database/security foundation**
   - role support, tables, RLS, settings, token helpers, RPCs and SQL tests.
2. **Resident flow**
   - create/share/download/revoke/duplicate/list and resident RLS tests.
3. **Public pass**
   - resolver, public page, generic errors, privacy and rate limits.
4. **Guard online flow**
   - gate picker, scanner/fallbacks, result card, check-in/out, inside/log views.
5. **Walk-ins and notifications**
   - approval flow, realtime/polling, all notification types and mute.
6. **Offline**
   - cache, queue, sync/review, logout wipe, service worker.
7. **Admin/retention**
   - aggregates, `k = 5`, settings, gates/guard assignment, purge and methodology.
8. **Verification**
   - SQL, unit, browser, accessibility, responsive, lint/typecheck/build.

---

## 14. Values proposed for confirmation

These are the specification defaults to confirm before implementation:

| Placeholder | Proposed value |
| --- | ---: |
| Maximum pass validity | 7 days |
| Maximum active passes per resident | 10 |
| Maximum advance start | 30 days |
| Pass creations per resident per day | 20 |
| Personal-data retention after pass end | 90 days |
| Retention configuration range | 30–365 days |
| Overstay grace/notification | 30 minutes after `valid_until` |
| Walk-in timeout/manual follow-up | 5 minutes |
| Short-code lock | 5 wrong attempts per device per minute |
| Offline cache horizon | Today and tomorrow |
| Offline cache refresh | Every 5 minutes and on reconnect |
| QR entropy | 128 bits |
| Short code | 8 characters |
| Admin suppression threshold | k = 5 |

The feature is implemented across migrations, resident/guard/admin/public routes, offline caching, notifications and tests. See the final report for confirmed defaults and deviations.
