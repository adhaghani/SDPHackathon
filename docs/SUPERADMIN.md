# Township provisioning

Superadmins use `/superadmin` to create and manage townships. Township managers continue to use `/admin`; their permissions remain limited to their own township. A platform owner does not need a resident membership.

## First superadmin

1. Apply migrations, including `20261017000000_platform_townships.sql`. For hosted Supabase, use `npx supabase db push --linked`; `npm run db:push` targets local Supabase.
2. Register the owner's account and confirm its email.
3. From the repository root, with the intended project's URL and secret/service-role key loaded, run:

   ```bash
   npm run superadmin:grant -- owner@example.com
   ```

   This trusted operator command finds the verified account and grants a platform role. It does not create an account or change its password. Check the project host printed by the command. Never expose the service key in a browser or add it to Git. Existing shell variables override the local environment files; the root `.env.local` takes precedence over `apps/web/.env.local`.

   To use a separate ignored hosted environment file:

   ```bash
   node --env-file=.env.cloud-demo.local --import tsx scripts/bootstrap-superadmin.ts owner@example.com
   ```

4. Sign in at `/superadmin`. Normal password sign-in also routes platform owners there. Platform roles cannot be self-assigned through registration metadata or resident requests.

The bootstrap command can appoint additional trusted platform owners. Platform role administration is deliberately not exposed to resident or township-manager screens.

## Create a township

1. Choose **Create township**.
2. Enter its name, unique slug, state, district, and unique resident join code.
3. Search the interactive map. Select **Draw polygon**, click around the boundary, and click the first point to close it. Use **Edit** to drag vertices, then save the edit with the map control. Drawing a new polygon replaces the previous one. Undo and delete controls are also available.
4. For keyboard workflows or externally prepared boundaries, expand **Enter boundary coordinates instead** and paste a GeoJSON Polygon using longitude/latitude pairs. The ring must close. Holes and more than 500 vertices are not supported.
5. Add at least one neighbourhood and choose membership and event approval settings.
6. Enter the first manager's name and email, then review and create.

The township is saved as a draft before email delivery. Geometry and neighbourhood creation are transactional; email delivery is an external step with its own retryable status. A failed invitation does not erase the draft or report the appointment as delivered. The server rejects invalid or self-intersecting boundaries. Overlapping polygon interiors require acknowledgement; shared edges alone do not count as an overlap.

## Manager appointments

- Existing verified accounts are appointed immediately.
- New or unverified accounts receive a Supabase Auth email sign-in link. The recipient opens `/manager-invitation`, chooses a password, accepts the terms/privacy policy, and accepts the appointment. Matching a verified account email to an unrevoked invitation is enforced in SQL.
- Delivery states are pending, sent, failed, accepted, and revoked. **Sent** means the Auth service accepted the send request; it does not prove inbox delivery.
- Use **Resend invitation** if delivery fails or a link expires. A one-minute resend limit applies after successful sending; Supabase Auth applies its own email limits too.
- Appoint a replacement before removing the last active manager of an active township. Removing a manager demotes their membership to resident and preserves their account and historical records. Draft/archived memberships are suspended on removal.
- Revoking a pending appointment prevents that link from granting manager permissions. It does not invalidate a general Supabase sign-in token or delete the recipient's account.

## Email configuration

Set `NEXT_PUBLIC_APP_URL` to the application's public HTTPS URL. In hosted Supabase Auth:

- Configure custom SMTP for real recipients.
- Allow the exact redirect `https://YOUR_APP/manager-invitation` in addition to the existing `/auth/callback` URL.
- Keep the default email template's confirmation link, or configure a token-hash template that routes through `/auth/callback?token_hash=...&type=magiclink&next=/manager-invitation`.

The server sends invitations using a separate, non-persistent implicit Auth client. This avoids binding the manager's email link to the superadmin browser's PKCE verifier. The invitation screen consumes the session fragment, clears it from the URL, and verifies the recipient with Supabase. Tokens are never stored in invitation rows or displayed in the portal.

The local Supabase mail inbox is at `http://127.0.0.1:54324`. Public deployments require their own SMTP configuration and cloud verification.

Auth emails now use [BorrowLah's shared HTML templates](EMAILS.md), including distinct manager-invitation copy. Templates are loaded locally from `supabase/config.toml`; install them separately in hosted Supabase Auth when deploying.

## Activate, edit, or archive

On the township detail page, check the manager section, continue through **Township details and boundary**, and select **Active** under **Review**. Activation requires an active manager or a successfully sent invitation. A manager who accepts while a township is still a draft sees a preparation message until activation.

Existing neighbourhoods are preserved when editing; entered names are added without deleting membership references. Boundary changes are saved with the township, and the office map uses the saved boundary when its map feature is enabled. The old illustrative map is retained only for demo townships without a saved boundary.

Archiving requires confirmation, removes the township from normal app entry and join-code discovery, and preserves historical data. Superadmins can restore it. Archiving is not a record purge or a retroactive cancellation of every existing booking or participant token.

The platform activity log records the actor, township, action, time, lifecycle transition, and boundary changes. Platform access does not automatically grant access to private resident messages or unit labels.

## Verification

```bash
npx supabase test db supabase/tests/platform_townships_test.sql
npm run test --workspace web -- tests/township-validation.test.ts
E2E_SKIP_RESET=true npm run test:e2e --workspace web -- platform-townships.spec.ts
```

The browser test provisions disposable users and one township on local Supabase only, then removes them. It refuses hosted Supabase targets and uses the local mail inbox to exercise the manager acceptance link. The normal browser suite resets local demo data unless `E2E_SKIP_RESET=true` is set.
