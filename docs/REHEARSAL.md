# Demo rehearsal record

## Environments

| Check | Status |
| --- | --- |
| Local Supabase + Next.js | Running against existing `SDPHackathon` demo stack; health endpoint, demo sign-in and Home verified on 14 October 2026 |
| Remote Supabase | Optional for remote hosting; no hosted project configured. Existing local Supabase is available and reused |
| Vercel preview | Not deployed; CLI has no saved authentication |
| Physical phone and laptop | Human device checks pending; browser viewport checks are separate evidence |
| Spoken three-minute rehearsal | Pending; script has 180 seconds of allocated time |

Local production browser verification completed on 14 October 2026: all 16 scenarios passed across the full run (14 passes) and the corrected organiser rerun (2 passes). Both resident and lender journeys at 390px and 1440px verified join, calendar request, approval, two-sided handover, confirmed return and exactly one reward entry per participant. Organiser check-in and office demand/cost journeys passed at both widths. Sign-out rejects a subsequent protected-page visit. The responsive audit passed at 320/390/768/1440px; accessibility and recycling checks passed.

Validation also passed 83 unit/component tests, 219 database assertions, lint, TypeScript and the production build. Development-mode action delays were observed under local machine load; final functional rehearsal used `next start`.

Automated tests are functional evidence, not a timed spoken rehearsal or a physical-device sign-off.

## Human run sheet

| Run | Environment/device | Duration | Booking completed? | Points entry? | Check-in? | Issue/owner |
| --- | --- | --- | --- | --- | --- | --- |
| Pending | Laptop + phone | — | — | — | — | Schedule with presenter |

Cloud acceptance: HTTPS health check, new member join, sign-out followed by protected-route rejection, complete loan with both participants, exactly-once ledger award, organiser check-in, admin isolation, 390px and 1440px navigation. Do not mark the preview complete until these pass against the remote URL.
