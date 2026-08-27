#!/usr/bin/env node
/**
 * neutralize-demo-admin.cjs — one-shot PROD remediation (Dev, 2026-08-27).
 *
 * WHY: prisma/seed.js shipped demo@tiretrader.test / demo1234 with admin:true, and
 * those credentials were public for weeks. Merging PR #22 only hid the launch banner;
 * the seeded account is still LIVE, SIGNABLE, and ADMIN on prod. This neutralizes it
 * WITHOUT deleting it (the demo seller owns demo listings — a delete would cascade/orphan):
 *   - admin        -> false   (removes /admin moderator access)
 *   - passwordHash -> rotated to an UNGUESSABLE random value in the app's own scheme
 *                     (sha256 pre-hash -> bcryptjs cost 12, matching lib/auth.js / seed.js)
 *                     so the public "demo1234" no longer authenticates.
 *
 * Idempotent (safe to re-run). Refuses to run against a local `file:` (SQLite dev) DB so
 * nobody mistakes a dev run for prod remediation. Usage:
 *   DATABASE_URL="<PROD neon url>" node scripts/neutralize-demo-admin.cjs [--dry]
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const DRY = process.argv.includes("--dry");
const EMAIL = "demo@tiretrader.test";
const url = process.env.DATABASE_URL || "";

function redactHash(h) { return h ? `${String(h).slice(0, 7)}…(${String(h).length} chars)` : "(none)"; }

(async () => {
  if (!url) { console.error("ABORT: DATABASE_URL not set. Pass the PROD Neon url."); process.exit(2); }
  if (url.startsWith("file:") && !process.argv.includes("--allow-dev")) {
    console.error(`ABORT: DATABASE_URL is a local SQLite dev DB (${url}). This tool is for PROD only — point it at the Neon prod url (or pass --allow-dev to test locally).`);
    process.exit(2);
  }
  const host = (url.match(/@([^/:?]+)/) || [])[1] || "unknown-host";
  console.log(`Target DB host: ${host}  (mode: ${DRY ? "DRY-RUN" : "LIVE WRITE"})`);

  const prisma = new PrismaClient();
  try {
    const before = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { id: true, email: true, role: true, admin: true, passwordHash: true },
    });
    if (!before) {
      console.log(`No account with email ${EMAIL} found — nothing to neutralize (already deleted?). Exit 0.`);
      process.exit(0);
    }
    console.log("BEFORE:", { id: before.id, email: before.email, role: before.role,
                             admin: before.admin, passwordHash: redactHash(before.passwordHash) });

    if (before.admin === false) {
      // Still rotate the password unless it's already been rotated — but we can't tell
      // if it's still "demo1234" without the plaintext, so always rotate to be safe.
      console.log("(admin already false — still rotating the password to be safe.)");
    }

    // rotate to an unguessable secret using the app's exact hashing scheme
    const secret = crypto.randomBytes(32).toString("hex");
    const newHash = bcrypt.hashSync(
      crypto.createHash("sha256").update(secret, "utf8").digest("base64"), 12);

    if (DRY) {
      console.log("DRY-RUN: would set admin=false and rotate passwordHash to", redactHash(newHash));
      process.exit(0);
    }

    await prisma.user.update({
      where: { email: EMAIL },
      data: { admin: false, passwordHash: newHash },
    });

    const after = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { id: true, email: true, role: true, admin: true, passwordHash: true },
    });
    console.log("AFTER: ", { id: after.id, email: after.email, role: after.role,
                             admin: after.admin, passwordHash: redactHash(after.passwordHash) });

    const ok = after.admin === false && after.passwordHash !== before.passwordHash;
    // sanity: the old public password must no longer authenticate
    const oldStillWorks = bcrypt.compareSync(
      crypto.createHash("sha256").update("demo1234", "utf8").digest("base64"), after.passwordHash);
    console.log(`VERIFY: admin==false: ${after.admin === false} | hash rotated: ${after.passwordHash !== before.passwordHash} | "demo1234" still authenticates: ${oldStillWorks}`);
    if (ok && !oldStillWorks) { console.log("✅ NEUTRALIZED: demo account is non-admin and the public password no longer works."); process.exit(0); }
    console.error("❌ VERIFY FAILED — inspect manually."); process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
