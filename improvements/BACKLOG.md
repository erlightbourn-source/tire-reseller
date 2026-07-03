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
| 3 | Hash the email-alerts confirm token at rest, matching the reset/verify token pattern | security-hardening | carried finding since 2026-07-01 | low | pending |
| 4 | Expand `e2e/flows.mjs` Playwright coverage for the core funnel: signup → verify → list a tire → buyer message → offer accept (scope on pickup; split if > small-diff) | test-coverage / resilience | audit 2026-07-02 (single e2e file) | none | pending |
| 5 | Error/loading boundary gap check: 7 `loading.js` exist — enumerate routes without one (or without empty-state handling) and fill the top gaps | resilience | audit 2026-07-02 | none | pending |
| 6 | Accessibility pass on browse + listing detail (labels, alt text on listing photos, focus states, contrast) | accessibility | own inspection 2026-07-02 | none | pending |
| 7 | Query-efficiency check on homepage/browse feeds (N+1s, unbounded takes, missing indexes worth flagging) — measure before changing | performance | own inspection 2026-07-02 | low | pending |

Refresh sources each run: latest flagged findings, newest `marketing-reports/*.md` recommendations,
`improve:` lines in ~/.claude/agent-logs/dev.log, and fresh inspection.
