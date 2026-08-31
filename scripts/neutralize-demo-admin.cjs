#!/usr/bin/env node
/**
 * neutralize-demo-admin.cjs — one-shot PROD remediation.
 *
 * 2026-08-27 (Dev): created to kill demo@tiretrader.test, which prisma/seed.js
 *   shipped with admin:true and the public password "demo1234".
 * 2026-08-31 (Dev): WIDENED — the original only covered demo@. The same seed run
 *   creates FOUR more accounts whose passwords are equally public, and they were
 *   left live:
 *     - buyer@tiretrader.test / buyer1234   (README.md line 93 publishes it)
 *     - mike@tiretrader.test  / seller1234  (pro seller)
 *     - rosa@tiretrader.test  / seller1234  (founding seller)
 *     - ken@tiretrader.test   / seller1234
 *   docs/index.html line 264 — the PUBLIC GitHub Pages demo — literally publishes
 *   the scheme (`email.startsWith('demo') ? 'demo1234' : email.startsWith('buyer')
 *   ? 'buyer1234' : 'seller1234'`), so "seller1234" is derivable by anyone who
 *   views source. mike/rosa/demo also carry seeded 4-5 star reviews, so taking one
 *   over hands an attacker an established, well-reviewed seller identity to run
 *   scams from on a live marketplace.
 *
 * WHAT IT DOES (per account, without deleting anything — these users own the demo
 * listings/threads/reviews, so a delete would cascade or orphan them):
 *   - admin        -> false   (removes any /admin moderator access)
 *   - passwordHash -> rotated to an UNGUESSABLE random value in the app's own
 *                     scheme (sha256 pre-hash -> bcryptjs cost 12, matching
 *                     lib/auth.js and prisma/seed.js) so the public password
 *                     stops authenticating.
 *
 * Idempotent: an account that is already non-admin AND whose public password no
 * longer authenticates is reported "already-neutralized" and left untouched.
 * Refuses a local `file:` (SQLite dev) DB so nobody mistakes a dev run for prod
 * remediation.
 *
 * Usage:
 *   DATABASE_URL="<PROD neon url>" node scripts/neutralize-demo-admin.cjs [--dry]
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const DRY = process.argv.includes("--dry");
const url = process.env.DATABASE_URL || "";

// Every account prisma/seed.js creates, with the public password it ships with.
const SEEDED_ACCOUNTS = [
  { email: "demo@tiretrader.test", publicPw: "demo1234" },
  { email: "buyer@tiretrader.test", publicPw: "buyer1234" },
  { email: "mike@tiretrader.test", publicPw: "seller1234" },
  { email: "rosa@tiretrader.test", publicPw: "seller1234" },
  { email: "ken@tiretrader.test", publicPw: "seller1234" },
];

const redactHash = (h) =>
  h ? `${String(h).slice(0, 7)}…(${String(h).length} chars)` : "(none)";

// Same scheme as lib/auth.js: SHA-256 pre-hash -> bcrypt cost 12.
const prehash = (plain) =>
  crypto.createHash("sha256").update(String(plain), "utf8").digest("base64");
const authenticates = (plain, hash) => bcrypt.compareSync(prehash(plain), hash);

async function neutralize(prisma, { email, publicPw }) {
  const before = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, admin: true, passwordHash: true },
  });

  if (!before) {
    console.log(`  ${email}: not found — nothing to do (already deleted?).`);
    return "absent";
  }

  const publicWorked = authenticates(publicPw, before.passwordHash);
  console.log(
    `  ${email}: role=${before.role} admin=${before.admin} ` +
      `hash=${redactHash(before.passwordHash)} "${publicPw}" authenticates=${publicWorked}`
  );

  if (before.admin === false && !publicWorked) {
    console.log("    -> already-neutralized, no mutation.");
    return "already";
  }

  if (DRY) {
    console.log("    -> DRY-RUN: would set admin=false and rotate the password.");
    return "would-fix";
  }

  const newHash = bcrypt.hashSync(prehash(crypto.randomBytes(32).toString("hex")), 12);
  await prisma.user.update({ where: { email }, data: { admin: false, passwordHash: newHash } });

  const after = await prisma.user.findUnique({
    where: { email },
    select: { admin: true, passwordHash: true },
  });
  const stillWorks = authenticates(publicPw, after.passwordHash);
  const ok = after.admin === false && after.passwordHash !== before.passwordHash && !stillWorks;
  console.log(
    `    -> AFTER admin=${after.admin} hash=${redactHash(after.passwordHash)} ` +
      `"${publicPw}" authenticates=${stillWorks} ${ok ? "✅" : "❌"}`
  );
  return ok ? "fixed" : "failed";
}

(async () => {
  if (!url) {
    console.error("ABORT: DATABASE_URL not set. Pass the PROD Neon url.");
    process.exit(2);
  }
  if (url.startsWith("file:") && !process.argv.includes("--allow-dev")) {
    console.error(
      `ABORT: DATABASE_URL is a local SQLite dev DB (${url}). This tool is for PROD only — ` +
        "point it at the Neon prod url (or pass --allow-dev to test locally)."
    );
    process.exit(2);
  }
  const host = (url.match(/@([^/:?]+)/) || [])[1] || "unknown-host";
  console.log(`Target DB host: ${host}  (mode: ${DRY ? "DRY-RUN" : "LIVE WRITE"})`);
  console.log(`Seeded accounts to check: ${SEEDED_ACCOUNTS.length}\n`);

  const prisma = new PrismaClient();
  const results = [];
  try {
    for (const acct of SEEDED_ACCOUNTS) {
      results.push([acct.email, await neutralize(prisma, acct)]);
    }
  } finally {
    await prisma.$disconnect();
  }

  const tally = results.reduce((m, [, r]) => ((m[r] = (m[r] || 0) + 1), m), {});
  console.log(
    "\nSUMMARY:",
    Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(" ") || "(none)"
  );

  if (results.some(([, r]) => r === "failed")) {
    console.error("❌ At least one account failed to neutralize — inspect manually.");
    process.exit(1);
  }
  console.log(
    DRY
      ? "DRY-RUN complete — no changes written."
      : "✅ All seeded demo accounts are non-admin and their public passwords no longer work."
  );
  process.exit(0);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
