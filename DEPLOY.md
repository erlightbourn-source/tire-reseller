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
   `postgresql://…` connection string.

2. **Switch Prisma to Postgres** (one line) in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

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
   npx prisma db seed   # optional demo data
   ```

6. **Deploy** — push to `main`; Vercel builds automatically. Done.

## Notes
- Keep local dev on SQLite: leave `provider = "sqlite"` and
  `DATABASE_URL="file:./dev.db"` in your local `.env`; only flip the provider for
  the production build (or keep a separate branch/env).
- Never commit real secrets — `.env` is git-ignored; set values in Vercel.
- Don't paste secrets into chat; the app reads everything from `process.env`.
