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
7. Free-tier Supabase projects can pause. Open the dashboard and run `npm run demo:reset` the day before a demo.

## Troubleshooting

- If Docker reports `toomanyrequests`, wait for the registry rate limit or exclude nonessential local services as shown above.
- If OrbStack is installed but the Docker socket is missing, run `orbctl start` before `npx supabase start`.
- If the database types look stale, run `npm run types:gen` after migrations.
