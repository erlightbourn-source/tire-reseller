# Go-live checklist

> **STATUS 2026-08-09: LIVE IN PRODUCTION at https://shoptiretrader.com on
> Vercel + Neon + Vercel Blob + Resend** (branded sender, domain-verified).
> Signup → email verify → login → photo upload smoke-passed end-to-end.
> Remaining open items live in `tiretrader-sofla-launch.md` (memory), notably
> the EVTech Vercel Pro trial ending ~Aug 20.

## Platform decision — SUPERSEDED
2026-07-19 Evan called "Cloudflare is current; Vercel rejected (Hobby forbids
commercial use)." **Superseded 2026-08-09 by Evan's own action:** he created
the Vercel account + deploy token for this launch and the app shipped on
Vercel (team EVTech, currently Pro trial — no Hobby ToS issue while Pro; the
commercial-use question returns only if the team downgrades to Hobby after the
trial, tracked in memory). The Cloudflare port below is retained as the
documented fallback path (`de/cf-port-spike-20260719` branch has the R2 spike).

### ⚠️ Honest caveat — this is a PORT, not a domain proxy
This codebase is currently **Vercel-native**: a Next.js 15 **server** app
(`next start`, `middleware.js` with per-request CSP nonce, API routes,
Stripe webhooks) on **Prisma + Postgres**, with **Upstash** (rate limit) and
**Vercel Blob** (uploads). Cloudflare CAN run it, but not by pointing DNS at the
current build — it needs an adapter + a few provider swaps:

| Piece today             | Cloudflare target                                   | Effort | Hard blocker? |
|-------------------------|-----------------------------------------------------|--------|---------------|
| Next.js server (Vercel) | `@opennextjs/cloudflare` → Workers/Pages            | ~½–1 day | **Yes** — no adapter installed; won't run on CF without it |
| Prisma + Postgres       | D1 (SQLite) via Prisma D1 adapter **OR** keep Postgres via Hyperdrive | ~½ day, migration risk | **Yes** — needs a live DB |
| Upstash Redis (rate)    | Cloudflare KV / Durable Objects                     | ~2–3 hr | No — `lib/security.js` degrades to in-memory (weak on serverless, but boots) |
| Vercel Blob (uploads)   | Cloudflare R2                                        | ~2–3 hr | **Effectively yes** — `app/api/upload/route.js` falls back to local `/public/uploads`, which does NOT persist on Workers → uploads need R2 to survive |

Interim option if Evan wants the domain live NOW: Cloudflare Pages serves a
**coming-soon page** on `shoptiretrader.com` while the app port lands. The full
marketplace is not a same-day Cloudflare deploy.

## The REAL remaining blockers (host-independent + Cloudflare-specific)
1. **Cloudflare write access** — the mini has NO Cloudflare auth (no
   `CLOUDFLARE_API_TOKEN`, `wrangler` not logged in). Nothing wires headless.
   **Evan-batchable:** `wrangler login` once on the mini, OR mint a scoped API
   token (Pages:Edit + Workers:Edit + D1:Edit + Zone DNS:Edit/Read).
2. **Database** — a live SQL store: **D1** (Cloudflare-native, free) or a
   Postgres (Neon) reached via Hyperdrive. Then `prisma migrate deploy`.
3. **Resend** — transactional email: API key + verified `EMAIL_FROM`
   (signup verification, offers, messaging all depend on it).
4. **Stripe** — seller subscriptions: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
   `STRIPE_WEBHOOK_SECRET`.
5. **App port** — the adapter + provider swaps in the table above.

2–4 were required under Vercel too; the platform change doesn't remove them, it
moves where they're configured. #1 and #5 are the new Cloudflare-specific work.

## Environment variables (Cloudflare Pages/Workers ▸ Settings ▸ Variables)
- `DATABASE_URL` (D1 binding or Hyperdrive/Neon Postgres URL)
- `APP_SECRET` = `openssl rand -base64 32` (≥32 chars — required)
- `NEXT_PUBLIC_SITE_URL` = `https://shoptiretrader.com`
- `RESEND_API_KEY`, `EMAIL_FROM`
- rate-limit binding (KV/DO) replacing `UPSTASH_REDIS_REST_URL/TOKEN`
- `CRON_SECRET` (gates the cron endpoints)
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- R2 binding replacing `BLOB_READ_WRITE_TOKEN` (persistent uploads)
- `ERROR_WEBHOOK_URL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (optional)

## Database
- `npm run db:migrate:deploy` against the chosen store (applies `prisma/migrations`).
- (optional) `npx prisma db seed` for demo data, or skip for clean prod.
- If migrating existing data: `npm run backfill` once (denormalized columns).

## Smoke test (prod URL)
- [ ] `GET /api/health` → `{ ok: true }`
- [ ] Sign up → receive verification email → verify → log in.
- [ ] Create a seller account, list a tire **with real photos**, browse it.
- [ ] Message a seller; make + accept an offer.
- [ ] Trigger Stripe checkout (test card) → seller subscription active.
- [ ] Confirm error/analytics events land.

## The part code can't do — liquidity
- [ ] Pick **one metro** (Broward-first) + **one channel**; recruit ~20–50 sellers by hand.
- [ ] Get **real listing photos** (the #1 trust/conversion driver).
- [ ] Drive buyers; instrument the funnel (view → message → offer → deal).

> The build is done. Remaining work = the Cloudflare deploy/port above +
> single-market liquidity — not more features.
