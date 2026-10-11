# Privacy and safety

This is design intent for a prototype, not legal advice.

## Data minimisation

- Collect email, display name, neighbourhood, interests, comfort settings and a unit label only for township verification.
- Never collect phone numbers, IC numbers or exact addresses.
- Consent timestamps are captured at sign-up and copied to the profile on join.
- Unit labels are visible only to the member and township admins.
- Residents never see other residents' point balances or raw ledgers.

## Aggregate insight

- Dashboards use aggregate RPCs only.
- Breakdowns with fewer than five distinct residents are suppressed.
- Raw ledger access for suspicious-activity review writes `audit_log`.
- Estimated purchases avoided is self-reported and always labelled estimated.

## Safety

- No payments are handled. Deposits are recorded only and arranged offline.
- Borrowing and help flows tell users to meet in shared spaces and never share bank or ID details.
- Reports, blocks, disputes and moderation actions are server-side checks.
- Three open reports auto-hide the target content pending review.

## Inclusion

- No individual leaderboards or streak-loss mechanics.
- Recognition is opt-in.
- Every camera flow has a manual fallback.
- Larger text, high contrast and reduce motion are profile comfort settings.

## Account controls

- Profile settings support display name, comfort settings and recognition opt-in.
- Future account deletion should anonymise the profile, remove photos and memberships, and preserve ledger integrity for auditability.
