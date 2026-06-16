# Deploying TireTrader (free tiers)

The static demo at `/docs` runs on GitHub Pages with no backend. To run the
**real Next.js app** (auth, database, messaging, uploads, email) you need a host
plus a Postgres database and (optionally) blob storage + email. All have free
tiers and none require a credit card.

## Accounts to create

| Service | Free tier | Copy out | Env var |
|---|---|---|---|
| **Neon** (Postgres) | 0.5 GB, no card | Connection string | `DATABASE_URL` |
| **Vercel** (hosting) | Hobby, no card | — (deploy target) | — |
| **Vercel Blob** (uploads) | 1 GB on Hobby | Read/write token | `BLOB_READ_WRITE_TOKEN` |
| **Resend** (email) | 3k emails/mo, no card | API key | `RESEND_API_KEY` |
| _you generate_ | — | `openssl rand -base64 32` | `APP_SECRET` |

> The app runs **without** Blob, Resend, or Stripe — those features fall back to
> local disk / console logging / simulated checkout. The only hard requirements
> for a real deploy are **Postgres** and **`APP_SECRET`**.

## Steps

1. **Neon** → neon.tech → sign up (GitHub) → New Project → copy the
   `postgresql://…` connection string. **Use the *pooled* connection string**
   (the host containing `-pooler`) for `DATABASE_URL` — serverless functions open
   many short-lived connections and will exhaust a direct Postgres connection
   under load. Append `?pgbouncer=true&connection_limit=1` if not already present.

2. **Prisma provider is automatic.** The `build` script runs
   `scripts/db-provider.mjs`, which sets the datasource provider to `postgresql`
   when `DATABASE_URL` is a `postgres://` URL (and `sqlite` otherwise). No manual
   schema edit needed — just set `DATABASE_URL` to your Neon string in the host.

3. **Resend** (optional) → resend.com → API Keys → Create → copy `re_…`.

4. **Vercel** → vercel.com → sign up with GitHub → Add New ▸ Project → import
   `erlightbourn-source/tire-reseller`.
   - Storage ▸ Create ▸ **Blob** (auto-sets `BLOB_READ_WRITE_TOKEN`).
   - If using Blob, add the dependency: `npm i @vercel/blob` (commit the change).
   - Project ▸ Settings ▸ **Environment Variables**, add:
     - `DATABASE_URL` = your Neon URL
     - `APP_SECRET` = output of `openssl rand -base64 32`
     - `NEXT_PUBLIC_SITE_URL` = your `https://<app>.vercel.app`
     - `RESEND_API_KEY`, `EMAIL_FROM` (optional)

5. **Create the tables** against Neon (from your machine, with `DATABASE_URL`
   pointing at Neon):
   ```bash
   npx prisma db push
   npx prisma db seed   # optional demo data (also backfills denormalized cols)
   ```
   **Upgrading an existing DB** after a schema change that adds the denormalized
   browse columns (`rimDiameter`, `treadDepth32`, `perTireCents`, `sellerPro`,
   `ratingAvg`, …): run `npx prisma db push` then **`npm run backfill`** once to
   populate them for existing rows. It's idempotent.

6. **Deploy** — push to `main`; Vercel builds automatically. Done.

### Rate limiting on serverless
The built-in rate limiter is in-memory, which does **not** work across Vercel's
serverless instances. For real throttling in production, create a free **Upstash
Redis** database and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`;
the limiter uses it automatically (and falls back to in-memory locally / if unset).

| Service | Free tier | Env vars |
|---|---|---|
| **Upstash** (Redis) | 10k cmds/day, no card | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

### Crons (scheduled in vercel.json, secured by CRON_SECRET)
- `/api/cron/alerts` (daily) — emails logged-in users **and** no-account email-alert
  subscribers a digest of new listings matching their saved searches.
- `/api/cron/purge` (daily) — permanently removes accounts past the 7-day
  soft-delete grace.
Set `CRON_SECRET` (any random string) so the endpoints are callable only by the
cron / your bearer token. Emails require `RESEND_API_KEY` (else digest logs to console).

### Analytics (optional)
Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to your domain to load privacy-friendly,
cookieless analytics (Plausible). Unset = no tracking. Custom events fire for
search, signup, message-seller, and email-alert signups.

## Notes
- Local dev stays on SQLite automatically (`DATABASE_URL="file:./dev.db"`).
- Never commit real secrets — `.env` is git-ignored; set values in Vercel.
- Don't paste secrets into chat; the app reads everything from `process.env`.
