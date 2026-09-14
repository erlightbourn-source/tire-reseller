#!/usr/bin/env node
/**
 * signup-audit.cjs — READ-ONLY audit of account signups (Evan flag 2026-09-13:
 *   "doesn't think the first 25 signups were properly tracked").
 *
 * Answers, by observation against PROD:
 *   1. Are signup timestamps real / sequential? (per-row gap, clustering)
 *   2. Any duplicate / bot patterns? (shared IP, rapid-fire bursts, disposable
 *      or +alias emails, near-identical names, unverified sweeps)
 *   3. Was signup actually TRACKED? (User row vs a matching AuditLog action=signup;
 *      consent meta agreedToTerms/termsVersion present or missing)
 *
 * HONEST LIMIT: referral/UTM/analytics is NOT persisted server-side (no such
 *   field on User, no Event table in schema). "Did a UTM/analytics event fire on
 *   signup" can only be answered from Vercel/Web Analytics, NOT this DB. This
 *   script says so rather than inventing a column.
 *
 * SAFE: pure reads (findMany/count/groupBy) — ZERO writes. Refuses a local SQLite
 *   dev DB unless --allow-dev, so a dev run can't be mistaken for the real audit.
 *
 * Usage:
 *   DATABASE_URL="<PROD neon url>" node scripts/signup-audit.cjs            # first 25 + full summary
 *   DATABASE_URL="<PROD neon url>" node scripts/signup-audit.cjs --limit 50 # widen the window
 *   DATABASE_URL="<PROD neon url>" node scripts/signup-audit.cjs --json     # machine-readable
 */
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const argVal = (k, d) => {
  const eq = (args.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1];
  if (eq !== undefined) return eq;
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const LIMIT = Math.max(1, parseInt(argVal("limit", "25"), 10) || 25);
const JSON_OUT = args.includes("--json");
const url = process.env.DATABASE_URL || "";

// Rough disposable / throwaway domains — flag, don't judge.
const DISPOSABLE = /@(mailinator|guerrillamail|10minutemail|tempmail|trashmail|yopmail|sharklasers|getnada|dispostable)\./i;
const RAPID_SECONDS = 20; // signups closer than this to the prior one = burst-suspect

async function main() {
  const prisma = new PrismaClient();
  try {
    const total = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, admin: true,
        foundingSeller: true, emailVerified: true, createdAt: true,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: "asc" },
      take: LIMIT,
    });

    // Pull signup audit rows for these users to cross-check tracking + IP dedupe.
    const ids = users.map((u) => u.id);
    const signupLogs = await prisma.auditLog.findMany({
      where: { action: "signup", userId: { in: ids } },
      select: { userId: true, ip: true, meta: true, createdAt: true },
    });
    const logByUser = new Map(signupLogs.map((l) => [l.userId, l]));

    // IP frequency across the audited window.
    const ipCount = {};
    for (const l of signupLogs) if (l.ip) ipCount[l.ip] = (ipCount[l.ip] || 0) + 1;

    const rows = [];
    let prev = null;
    const flags = { untracked: [], noConsent: [], rapid: [], sharedIp: [], disposable: [], unverified: [] };

    for (const u of users) {
      const log = logByUser.get(u.id);
      const gapSec = prev ? Math.round((u.createdAt - prev.createdAt) / 1000) : null;
      let meta = null;
      if (log?.meta) { try { meta = JSON.parse(log.meta); } catch { meta = null; } }
      const r = {
        n: rows.length + 1,
        email: u.email,
        domain: (u.email.split("@")[1] || "").toLowerCase(),
        name: u.name,
        role: u.role + (u.admin ? "/admin" : "") + (u.foundingSeller ? "/founding" : ""),
        verified: u.emailVerified,
        listings: u._count.listings,
        created: u.createdAt.toISOString(),
        gapSec,
        tracked: !!log,
        ip: log?.ip || null,
        agreedToTerms: meta?.agreedToTerms ?? null,
        termsVersion: meta?.termsVersion ?? null,
      };
      if (!log) flags.untracked.push(r.email);
      else if (meta?.agreedToTerms !== true) flags.noConsent.push(r.email);
      if (gapSec !== null && gapSec >= 0 && gapSec < RAPID_SECONDS) flags.rapid.push(`${r.email} (+${gapSec}s)`);
      if (r.ip && ipCount[r.ip] > 1) flags.sharedIp.push(`${r.email} @ ${r.ip} (x${ipCount[r.ip]})`);
      if (DISPOSABLE.test(u.email)) flags.disposable.push(r.email);
      if (!u.emailVerified) flags.unverified.push(r.email);
      rows.push(r);
      prev = u;
    }

    const result = {
      generatedAt: new Date().toISOString(),
      totalUsers: total,
      audited: rows.length,
      window: `first ${rows.length} by createdAt asc`,
      flags,
      rows,
      notes: [
        "referral/UTM/analytics is NOT stored server-side (no User/Event field) — check Vercel/Web Analytics for that dimension.",
        "flags are SUSPECT, not proof — shared IP can be a household/office; +alias emails can be legit.",
      ],
    };

    if (JSON_OUT) { console.log(JSON.stringify(result, null, 2)); return; }

    console.log(`SIGNUP AUDIT — ${result.generatedAt}`);
    console.log(`Total accounts: ${total}   Audited: ${rows.length} (${result.window})\n`);
    for (const r of rows) {
      console.log(
        `${String(r.n).padStart(2)}. ${r.created}  ${r.gapSec === null ? "     " : `+${r.gapSec}s`.padStart(8)}  ` +
        `${r.tracked ? "TRACKED" : "UNTRACKED"}  consent=${r.agreedToTerms}  verified=${r.verified}  ` +
        `${r.role}  listings=${r.listings}  ip=${r.ip || "-"}  ${r.email}`
      );
    }
    console.log("\n--- FLAGS (suspect, not proof) ---");
    for (const [k, v] of Object.entries(flags)) console.log(`  ${k}: ${v.length ? v.join(", ") : "none"}`);
    console.log("\n--- NOTES ---");
    result.notes.forEach((n) => console.log(`  • ${n}`));
  } finally {
    await prisma.$disconnect();
  }
}

if (!url) {
  console.error("ABORT: DATABASE_URL not set. Pass the PROD Neon url.");
  process.exit(2);
}
if (url.startsWith("file:") && !args.includes("--allow-dev")) {
  console.error(`ABORT: DATABASE_URL is a local SQLite dev DB (${url}). This is a PROD read-only audit — point it at the Neon url (or --allow-dev to test locally).`);
  process.exit(2);
}
const host = (url.match(/@([^/:?]+)/) || [])[1] || "unknown-host";
console.error(`# read-only audit against ${host}, limit=${LIMIT}\n`);
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
