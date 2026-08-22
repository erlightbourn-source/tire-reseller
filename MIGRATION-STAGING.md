# TireTrader — Vercel → Render migration (STAGED, not executed)

**Author:** Dev · **Date:** 2026-08-22 · **Trigger:** Miles ask — have a fallback ready
in case Evan picks "migrate" or doesn't decide before the **Vercel Pro trial ends Sun
2026-08-23 20:55 EDT** (auto-reverts to Hobby; Hobby's non-commercial ToS + limits are a
problem for a live commercial marketplace, no card on file).

**Status: PREP ONLY.** Nothing deployed, no accounts created, no spend. This branch adds
`render.yaml` + this runbook so a "migrate" call is a ~30–45 min execution, not a cold start.

---

## The good news: the app is highly portable

Verified against the repo (2026-08-22):

| Concern | State | Migration action |
|---|---|---|
| **Neon (Postgres)** | External SaaS, independent of Vercel | **None** — reuse `DATABASE_URL` verbatim. DB does not move. |
| **Resend (email)** | External SaaS | **None** — reuse `RESEND_API_KEY` / `EMAIL_FROM`. |
| **Stripe** | External SaaS | Reuse keys; **re-point the webhook URL** to the Render host. |
| **Upstash (rate-limit)** | External SaaS | **None** — reuse `UPSTASH_*`. (Also degrades to in-memory if absent.) |
| **Next.js server** | `next build` / `next start`, standard Node | Render Web Service runs it directly (near-drop-in). |
| **Secure cookies / deploy-mode** | `lib/auth.js` + `lib/security.js` gate on `NODE_ENV==="production"` **OR** `VERCEL_ENV` | Set `NODE_ENV=production` → identical behavior, **zero code change**. `VERCEL_ENV` not needed. |
| **Uploads (`@vercel/blob`)** | `app/api/upload/route.js` uses Blob **only** when `BLOB_READ_WRITE_TOKEN` is set; else local `/uploads` (ephemeral) | **Keep the token** → uploads persist via Vercel Blob cross-host, zero code change. Durable follow-up: swap to Cloudflare R2 / S3. |
| **Crons (`vercel.json`)** | 2 jobs: `/api/cron/alerts` (0 14), `/api/cron/purge` (0 3), Bearer-gated on `CRON_SECRET` | Recreated as Render Cron Jobs (see `render.yaml`). |

**Why Render over Netlify:** full server app (API routes + middleware) runs directly on
Render's Node service; Netlify would need the Next runtime adapter + functions split =
more surface/risk in the window. Render free tier permits commercial use (idle spin-down;
bump to Starter ~$7/mo only if cold-starts hurt conversion — an Evan spend decision, not
required to launch).

---

## Execution runbook (only if Evan says "migrate")

1. **Create Render account** (Evan — free; GitHub-connect the `tire-reseller` repo).
2. **Apply the blueprint:** Render → New → Blueprint → pick the repo/`main` → it reads
   `render.yaml` (web service + 2 cron jobs).
3. **Set the `sync:false` env vars** — copy verbatim from the Vercel project env
   (DATABASE_URL, APP_SECRET, RESEND_API_KEY, EMAIL_FROM, STRIPE_*, UPSTASH_*, CRON_SECRET,
   ERROR_WEBHOOK_URL, BLOB_READ_WRITE_TOKEN). `NODE_ENV/APP_URL/NEXT_PUBLIC_SITE_URL` are
   baked in the blueprint.
4. **First deploy** on the Render subdomain (`*.onrender.com`) — smoke-test BEFORE DNS:
   home 200, login, create listing, **photo upload persists**, Stripe test checkout, an
   alerts-cron manual curl returns 200.
5. **Re-point Stripe webhook** to `https://<render-host>/api/stripe/webhook` (or the app's
   webhook path); update `STRIPE_WEBHOOK_SECRET` to the new endpoint's secret.
6. **DNS cutover:** point `shoptiretrader.com` at Render (CNAME per Render's custom-domain
   flow) and add the domain in Render. TTL-aware; keep Vercel up until DNS propagates.
7. **Verify on the real domain**, then decommission the Vercel project (or leave it on
   Hobby as a cold standby — but the Blob store must stay alive while the token is in use).

**Rollback:** DNS back to Vercel (keep the Vercel project until Render is proven on the
apex). Nothing here is one-way until the Vercel project is deleted.

---

## Open items to confirm AT execution (not blockers, just verify-don't-assume)
- **Vercel Blob longevity on Hobby:** if the Vercel project reverts to Hobby, confirm the
  Blob store + token stay valid. If not, do the R2/S3 swap first (small change in
  `storeBlob`, `app/api/upload/route.js`). This is the only item that could need code.
- **Stripe webhook secret** is endpoint-specific — regenerate on the new host.
- **Render free-tier spin-down** adds cold-start latency; acceptable for launch traffic,
  revisit if conversion-sensitive.

Everything else is env-var copy + DNS. No code changes required for the fast path.
