# Privacy and safety

Prototype access policy, confirmed by the project owner on 14 October 2026. This document resolves older blanket statements that admins never see individual records.

## Who can see what

| Data | Resident | Organiser | Township admin | Sponsor / guard |
| --- | --- | --- | --- | --- |
| Unit label and membership | Own only | Own only | Members of their township for verification | Guard receives the destination unit only for an authorised guest workflow |
| Display name | Active co-members | Active co-members | Active co-members | Only as required by an authorised workflow |
| Profile preferences and consent timestamps | Own only | Own only | Own only | Own only |
| Booking and messages | Borrower or lender | As a participant | Operational review in own township | No general access |
| Event RSVP/check-in records | Own | Staff for the assigned event | Own township | No general access |
| Points ledger | Own | Own | Suspicious-activity review through `admin_ledger_candidates`; every call writes `audit_log` | No general access |
| Recycling logs/photos | Own only | Own only | Aggregate campaign totals, no resident logs | No general access |
| Demand identity records | No direct access | No direct access | No direct access; suppressed aggregates only | No access |
| Dashboards | Personal summaries | Authorised operations | Aggregate township reporting | Partner-specific aggregates / guard-specific operations |

An admin role in one township grants no access to another township. Shared profile names use `public_profiles`, which projects only ID and display name and checks active co-membership. The full `profiles` table is restricted to its owner. Unit labels remain in `township_members` under owner-or-township-admin RLS.

Admin access is for verification, disputes and programme operation. Do not describe booking messages as accessible exclusively to participants: the township office can review them. Ordinary operational reads are not all audit logged. Raw points-ledger review is audit logged; direct selection of other people's ledger rows remains denied, including for admins.

## Demand and reporting

`search_events` contains anonymous searches and result counts, with no user ID. Search count means the number of search rows, not the sum of results returned. A separate, non-client-readable `borrow_demand_residents` table deduplicates authenticated residents by township, term and category. Only records searched within 30 days count; expired rows are deleted on the next search. This is restricted identity storage, not anonymous collection. No historical resident demand is invented or backfilled.

Distinct-resident demand is suppressed below five. Legacy anonymous data is shown only in explicitly fictional demo demand gaps, with its resident count labelled unrecorded. Supply tables show category search totals separately from resident counts. Small counts must not be interpreted as distinct people.

Resident recycling entries, including custom kg and photos, are self-reported estimates. Campaign progress uses those estimates. No staff-recorded measured collection total exists yet. A future measured stream must record staff identity, scale/receipt reference, collection date and correction history separately, and must not add resident estimates to collection weights or count them twice.

## Data minimisation and safety

Collect the minimum data for each workflow. Core membership does not collect a phone or IC number; a unit label supports township verification. Guest passes may collect visitor name, phone and vehicle plate under their separate retention policy. See `docs/features/guest-pass.md` for the guard's limited access and default 90-day retention.

Consent timestamps are captured at sign-up and join. Deposits are recorded and arranged offline; the app does not hold payments. Meet in shared spaces, avoid bank/ID details in messages, and provide a staffed escalation path for late, damaged or disputed returns. Reports, blocks and transition permissions are checked on the server.

## Inclusion and account controls

No individual leaderboards or streak-loss mechanics. Recognition is opt-in. Camera flows have a manual fallback. Comfort settings support larger text, high contrast and reduced motion.

Profile export and account deletion are implemented. Export returns the signed-in user's profile, memberships, points, badges and redemptions; it is not yet a complete export of every feature's records. Deletion anonymises application records and removes the auth account through a server-only privileged call. Do not promise comprehensive media erasure until retention and orphaned-object cleanup have been independently checked.
