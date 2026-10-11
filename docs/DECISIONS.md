# Decisions

## 2026-10-11 — Initial foundation choices

1. **Package runner:** the repository declares `packageManager: npm@11.20.0` and has `package-lock.json`; pnpm is not installed. Use npm for local scripts while preserving the brief's script names. If pnpm becomes available, prefer it without changing application code.
2. **Monorepo layout:** keep the existing `apps/web` + `packages/ui` structure. The brief's suggested `src/` layout maps to `apps/web/`; shared shadcn source stays in `packages/ui`.
3. **Local Supabase:** Docker is available, so prefer local Supabase (`supabase start`) for development and tests. The Supabase CLI itself may need installation; document the exact version and commands in `docs/SETUP.md`.
4. **Services:** use only Next.js/Vercel and Supabase as specified. No AWS or extra infrastructure services.
5. **Timezone:** store UTC; compute and display weeks/months in `Asia/Kuala_Lumpur`.
6. **Design source:** section 8 of the brief overrides generic frontend defaults. The township line is the single memorable motif; Emas is reserved exclusively for BetterPoints.
7. **Security posture:** server actions validate with Zod, verify the user with `supabase.auth.getUser()`, and call integrity-critical `SECURITY DEFINER` RPCs as the signed-in user. `src/lib/supabase/admin.ts` (mapped to the web app) is `server-only`.
8. **Honesty:** all seed data is labelled demo data; estimates are labelled estimated; starting point values are labelled as assumptions.
9. **Local Supabase services:** Phase 0 starts only the database, auth, REST, Kong, mailpit and metadata services. Realtime, storage, Studio, Edge Runtime, Logflare, Vector and imgproxy are excluded locally until their Phase 1/2 slices need them; this keeps the first checkpoint reproducible and avoids unnecessary image pulls.
10. **Auth flow:** use PKCE consistently in browser, server and proxy clients. The proxy refreshes the session once per navigation, while server actions call `getUser()` before mutations.
11. **Testing stack:** Vitest covers unit/schema tests; Playwright is included now so the Phase 4 golden path can grow from the verified Phase 0 auth flow.
12. **Phase 1 write path:** resident-facing writes for events, items, bookings and profile updates go through Postgres `SECURITY DEFINER` RPCs. Direct table writes are revoked for `authenticated`, with RLS still enabled for defense in depth.
13. **QR check-in:** ticket tokens are HS256 JWTs with a 90-second lifetime, rendered by `qrcode.react`. Staff can scan with `@yudiel/react-qr-scanner` or paste a token for the accessible fallback; both paths verify signature/expiry before `check_in`.
14. **Seed history:** `scripts/seed-demo.ts` creates demo auth users through the Supabase admin API and drives real `check_in`, `transition_booking` and `award_points` calls with seed-only backdating. It is idempotent and keeps Aisyah at 1,250 BP.

No product decisions requiring human input are currently blocked.
