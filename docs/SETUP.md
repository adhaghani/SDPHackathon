# Setup

## Local development

Requirements: Node 20+, npm, Docker, and the Supabase CLI (the repository uses `npx supabase` so a global install is optional).

```bash
npm install
npx supabase start
npx supabase db push
npm run types:gen
cp .env.example .env.local
# Fill .env.local with the values printed by `npx supabase status -o env`.
npm run dev
```

For a faster local start when Docker images are rate-limited, exclude services that are not needed by Phase 0:

```bash
npx supabase start --exclude realtime,storage-api,imgproxy,studio,edge-runtime,logflare,vector
```

The local health endpoint is `http://127.0.0.1:3000/api/health`. It should return:

```json
{
  "ok": true,
  "data": { "ok": true, "database": "postgres", "checked_at": "..." }
}
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:e2e
```

## Environment variables

See `.env.example`. Never commit `.env.local`, the Supabase secret key, or the QR signing secret.

## Human-only cloud steps

These steps require accounts or dashboard access that only a person can provide.

1. Create a Supabase project in the Singapore region. Copy the project URL, publishable/anon key and secret/service-role key. Save the database password.
2. Link and push migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:push:remote
   ```

3. In the Supabase dashboard, confirm that `pg_cron`, `pg_trgm` and `btree_gist` are enabled. The migration attempts to enable them; `pg_cron` is tolerated when unavailable locally.
4. In Auth settings, set the Site URL and redirect URLs for localhost, Vercel previews and production. For the demo, disable email confirmation or configure custom SMTP.
5. Import the repository into Vercel. Set Preview and Production environment variables and use the Singapore function region when the plan allows.
6. If using the keep-alive workflow, add the required GitHub secrets.
7. Before a hosted demo, confirm the hosted project is running and check the deployed `/api/health`. `npm run demo:reset` resets local Supabase only; it does not resume or refresh a hosted project.

## Troubleshooting

- If Docker reports `toomanyrequests`, wait for the registry rate limit or exclude nonessential local services as shown above.
- If OrbStack is installed but the Docker socket is missing, run `orbctl start` before `npx supabase start`.
- If the database types look stale, run `npm run types:gen` after migrations.

## Cloud preview handoff (14 October 2026)

No remote project exists yet and this machine has no saved Vercel login. The preview is **not deployed**. The project owner must create the Supabase project and authenticate Vercel; no credentials should be pasted into chat or committed.

In Vercel, import this repository with **Root Directory `apps/web`**, framework Next.js, and include source files outside the root directory so `packages/ui` is available. Install from the workspace lockfile. `apps/web/vercel.json` declares the framework and Singapore region. Set the environment variables from `.env.example` in the Preview environment using the new remote Supabase project, not `127.0.0.1` values. Generate independent signing and cron secrets. Keep demo and pilot projects separate.

After linking Supabase, push migrations, generate database types, and run `npm run seed` against the remote demo environment only. `npm run demo:reset` always resets local Supabase and is not a cloud reset command. Check the seed's configured target before running it. Never seed a real resident pilot.

Set `NEXT_PUBLIC_APP_URL` to the resulting HTTPS preview URL, configure Supabase Site URL and authorised auth callback URLs, then redeploy. Set `NEXT_PUBLIC_DEMO_MODE=true` only for the fictional demo and enable only the features needed in the presentation. Keep demo mode false for a resident pilot.

Use `docs/REHEARSAL.md` as the cloud acceptance checklist. The local browser tests do not verify cloud cookies, redirect URLs, deployed secrets or physical phone camera access. If the selected Vercel plan does not support the configured region, use the available region and record it.

To run the browser journeys against an already seeded preview, use `PLAYWRIGHT_BASE_URL=https://your-preview.example npm run test:e2e`. That skips the local web server and local database reset. The tests expect the fictional demo accounts and create test users and bookings; run them only against a dedicated demo environment. For a deliberate local rerun without reseeding, use `E2E_SKIP_RESET=true npm run test:e2e`; the normal command resets local demo data.

For a local production rehearsal, run `npm run build --workspace web`, then `E2E_PRODUCTION=true npm run test:e2e`. The browser harness starts `next start` instead of the development compiler. If a clean local seed has just been verified, add `E2E_SKIP_RESET=true` to avoid a second reset. On 14 October 2026 the production build completed both viewport booking journeys while development-mode action latency was inconsistent under machine load.
