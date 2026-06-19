# Go-live checklist

The app is feature-complete and verified; these are the human/account steps to
take it from "builds locally" to "live with real users." Full provider details
are in [DEPLOY.md](DEPLOY.md).

## 1. Provision (free tiers, no card)
- [ ] **Neon** Postgres → copy the **pooled** connection string.
- [ ] **Vercel** project → import the repo.
- [ ] **Upstash** Redis (rate limiting across serverless instances).
- [ ] **Resend** (transactional email) → API key + a verified `EMAIL_FROM`.

## 2. Set environment variables (Vercel ▸ Settings ▸ Environment Variables)
- [ ] `DATABASE_URL` = Neon pooled URL (`?pgbouncer=true&connection_limit=1`)
- [ ] `APP_SECRET` = `openssl rand -base64 32` (≥32 chars — required)
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://<app>.vercel.app`
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] `CRON_SECRET` (any random string — gates the cron endpoints)
- [ ] `ERROR_WEBHOOK_URL` (optional — forwards client errors to Slack/Logtail)
- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (optional — analytics)
- [ ] Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- [ ] `BLOB_READ_WRITE_TOKEN` (Vercel Blob, for persistent uploads) — then
      `npm i @vercel/blob` and commit.

## 3. Database
- [ ] `npm run db:migrate:deploy` against Neon (applies `prisma/migrations`).
- [ ] (optional) `npx prisma db seed` for demo data, or skip for a clean prod.
- [ ] If migrating an existing DB: `npm run backfill` once (denormalized columns).

## 4. Enable CI (one-time, needs the `workflow` git scope)
```bash
gh auth refresh -s workflow
mkdir -p .github/workflows && sed '1,12d' ci-workflow.yml > .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "Add CI" && git push
```

## 5. Smoke test (prod URL)
- [ ] `GET /api/health` → `{ ok: true }`
- [ ] Sign up → receive the verification email → verify → log in.
- [ ] Create a seller account, list a tire **with real photos**, browse it.
- [ ] Message a seller; make + accept an offer.
- [ ] Trigger Stripe checkout (test card) → seller subscription active.
- [ ] Confirm Plausible/Sentry-webhook/error logging receive events.

## 6. The part code can't do — liquidity
- [ ] Pick **one metro** + **one channel**; recruit ~20–50 sellers by hand.
- [ ] Get **real listing photos** (the #1 trust/conversion driver).
- [ ] Drive buyers; instrument the funnel (view → message → offer → deal).

> The build is done. The remaining work is deployment config (above) and
> single-market liquidity — not more features.
