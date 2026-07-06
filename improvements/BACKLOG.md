# TireTrader Improvement Backlog

Ranked queue for the scheduled safety+improvement routine (step 3b). Each run implements the top 1–2 items
(up to 3 on a fast-path run), one commit per item, build+test gated, ≤ ~150 changed lines each.
Statuses: `pending` · `in-progress` · `shipped <commit>` · `proposal <commit>` (awaiting PR review) · `needs-plan` · `dropped <why>`.
Never in scope here: schema migrations, monetization/pricing, GitHub Actions files, dependency major/minor upgrades.

LAUNCH WEIGHTING (Evan, 2026-07-02 — TireTrader launches THIS YEAR): rank launch-readiness
items (GO-LIVE.md gaps, Stripe live-mode readiness, deploy/env prep, seller onboarding
hardening) above nice-to-haves. Code-side launch blockers known: **0** — the 24 unchecked
GO-LIVE.md items are provisioning/ops (Neon, Vercel, Upstash, Resend, Stripe keys, migrate,
smoke test) owned by Evan; legal pages (terms/privacy) exist. Stripe live-mode and the
deploy are Evan's calls — prepare, never pull the trigger.

| rank | item | category | source | risk | status |
|------|------|----------|--------|------|--------|
| 1 | Route-level tests locking the per-address email caps (`forgot-addr`, `resend-verify-addr` from 8b2be88): 4th same-address request in an hour → 429, different address unaffected, neutral `{ok:true}` symmetry for existing vs non-existing accounts | test-coverage | audit 2026-07-02 (change merged untested at route level) | none | shipped 2026-07-02 (PR #3, e2e 7→9) |
| 2 | PROPOSAL: align soft-delete reactivation restore rule with the auto-hide rule — `app/api/auth/login/route.js` restores at raw `_count.reports < 3`, `app/api/reports/route.js` hides at 5 credible (>24h) reporters; shared `lib/moderation.js` used by both. Decision point for Evan: exact restore threshold | correctness / security-hardening | flagged finding 2026-07-02 | low (auth-flow → PROPOSAL commit) | proposal 2026-07-02 (PR #3) |
| 2.5 | Launch-readiness sweep: extend e2e smoke to mirror GO-LIVE.md §5 (list a tire → message → offer accept), verify fail-closed prod paths (APP_SECRET, CRON_SECRET, Upstash warning), Stripe webhook test-mode dry run | launch-readiness | launch mandate 2026-07-02 | low | pending |
| 3 | Hash the email-alerts CONFIRM token at rest, matching the reset/verify token pattern | security-hardening | carried finding since 2026-07-01 | low (auth-flow → PROPOSAL) | proposal 2026-07-06 (PR pending) |
| 3a | Harden the UNSUBSCRIBE token: it's a persistent capability the alerts cron re-emits per digest, so it can't be hashed at rest — needs a per-email HMAC (store a secret, sign `alertId` per send) so a leaked row can't be replayed. Design change → needs a plan | security-hardening | 2026-07-06 scoping of finding #2 | low | needs-plan |
| 3b | Build the missing token/email test lane: a dev-only email outbox (in-memory ring buffer in lib/email.js, non-prod gated) + a Prisma sqlite integration-test runner separate from the pure `node --test` suite, so route+DB+email flows (reset, verify, confirm, unsubscribe) get real automated regression tests. Unblocks proper testing of #3/#3a/#4 | test-coverage / infra | 2026-07-06 (confirm-token change had no wireable test) | low-med | needs-plan |
| 3c | FLAG (Evan/ops, not code): Node runtime CVEs (CVE-2025-55131/55130/59465, HIGH) fixed in ≥22.22.0 on the 22.x LTS line — local/build Node is 22.14.0. Update the deploy runtime to ≥22.22.0, THEN add an `engines` pin (pinning now would EBADENGINE against 22.14.0). `npm audit` = 0 (these are runtime, not dependency, CVEs) | security-hardening / launch-readiness | Ada intel 2026-07-06 | low | flagged 2026-07-06 |
| 4 | Expand `e2e/flows.mjs` Playwright coverage for the core funnel: signup → verify → list a tire → buyer message → offer accept (scope on pickup; split if > small-diff) | test-coverage / resilience | audit 2026-07-02 (single e2e file) | none | pending |
| 5 | Error/loading boundary gap check: 7 `loading.js` exist — enumerate routes without one (or without empty-state handling) and fill the top gaps | resilience | audit 2026-07-02 | none | pending |
| 6 | Accessibility pass on browse + listing detail (labels, alt text on listing photos, focus states, contrast) | accessibility | own inspection 2026-07-02 | none | pending |
| 7 | Query-efficiency check on homepage/browse feeds (N+1s, unbounded takes, missing indexes worth flagging) — measure before changing | performance | own inspection 2026-07-02 | low | pending |
| 8 | Render the existing `SAFETY_WARNING` (+ `detectOffPlatform`) from `lib/safety.js` inside `components/MessageSeller.js` — the off-platform-scam warning already shows on the listing description but NOT in the composer, the exact moment a buyer is most exposed. Pure UI wiring, no schema/billing. Marketing review's #1 top-3, tagged data-engineer-safe | security-hardening / trust | marketing-reports/2026-07-06 (C1) | low | shipped 2026-07-06 (d307f31) |
| 9 | Reuse `components/EmailAlertForm.js` on the homepage hero (`app/page.js`) + the SEO landing pages (`app/sizes/[size]`, `app/tires/[brand]`) — today it only appears on a zero-result browse search, capturing the most-disappointed users and ignoring everyone else. Launch-phase demand capture. Wiring is low-risk; the incentive/privacy copy (A2) needs a quick Evan sign-off | launch-readiness / acquisition | marketing-reports/2026-07-06 (A1/A2) | low | pending |
| 10 | Link `app/sizes/[size]` to `/guide` + FAQ block for parity with `app/tires/[brand]` (dwell/SEO/trust) | acquisition / SEO | marketing-reports/2026-07-06 (A3) | none | shipped 2026-07-06 (2f8b06f) |

Refresh sources each run: latest flagged findings, newest `marketing-reports/*.md` recommendations,
`improve:` lines in ~/.claude/agent-logs/dev.log, and fresh inspection.
