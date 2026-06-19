# Architecture & key decisions

A short record of the non-obvious design choices, so future work doesn't undo
them by accident.

## Brand & the two implementations
- **Brand: brutalist** — near-black + acid yellow (`#e5ff00`), Georgia body /
  Courier headers, square edges, hard offset shadows, instant color-invert
  hovers. This is the deliberate, canonical identity. Defined centrally in
  `app/globals.css` + `tailwind.config.js` (the whole app reskins from there).
- **The Next.js app is canonical.** `docs/index.html` is a **frozen static
  preview** (GitHub Pages, localStorage, no backend) for a quick look. Do **not**
  port new features to the demo — build in the app. The demo's CSS is precompiled
  (`docs/tw.css` via `npm run demo:css`), not a runtime CDN.

## Database
- **Postgres is the canonical provider** (`prisma/schema.prisma`), with a
  committed baseline migration in `prisma/migrations/` and `db:migrate:deploy`
  for prod. **Local dev is zero-config sqlite**: `scripts/db-provider.mjs` swaps
  the provider to `sqlite` for a `file:` `DATABASE_URL`, and runs before every
  prisma command (postinstall/build/db:push/setup).
- **Denormalized, indexed columns drive browse at scale** instead of in-JS
  filtering + full-table scans:
  - `Listing.widthMm/aspectRatio/rimDiameter` (parsed from the size string by
    `lib/tiresize.js`) → indexed size/rim filtering, no `LIKE '%…%'`.
  - `Listing.treadDepth32`, `perTireCents`, `sellerPro` → DB-side tread filter,
    one-groupBy fair-price, and DB ordering by featured→pro→recency.
  - `User.ratingAvg/ratingCount` → DB-side min-rating filter.
  - Maintained on every write path (create/bulk/edit, reviews, /api/pro +
    Stripe webhook) and backfilled by `prisma/backfill.mjs` (`npm run backfill`).
- Browse paginates in the DB (`skip`/`take` + `count`); radius search uses a
  lat/lng bounding-box prefilter then JS haversine (SQLite has no geo).

## Auth & security
- Passwords: **SHA-256 pre-hash → bcrypt cost 12** (no 72-byte truncation).
  Sessions: signed JWT cookie (HttpOnly, SameSite=Lax, Secure in prod), pinned
  HS256, `tokenVersion` revocation. `APP_SECRET` ≥32 chars required on any
  deployed env (prod **and** Vercel preview).
- **Email-verified signup (double opt-in):** signup is neutral (no existence
  oracle), creates an unverified account + emails a 24h token; login is blocked
  until `/api/auth/verify`. `lib/auth.js`, `app/api/auth/{signup,login,verify,
  resend-verification}`.
- CSP with a **per-request nonce in prod** (middleware), CSRF same-origin check,
  rate limiting (Upstash in prod), HIBP breached-password check, audit log,
  soft-delete + GDPR export/deletion. JSON-LD is escaped via `lib/jsonld.js`.

## Observability
- `/api/health` (DB-reachability probe). Client errors from the React error
  boundaries POST to `/api/client-error`, which logs to the host and forwards to
  `ERROR_WEBHOOK_URL` when set. Analytics via Plausible (env-flagged).

## Testing
- `npm test` — fast unit tests (`node:test`, pure logic in `lib/`).
- `npm run test:e2e` — boots the built app and exercises real HTTP flows
  (`e2e/flows.mjs`); kept out of `test/` so the unit run never spawns a server.
