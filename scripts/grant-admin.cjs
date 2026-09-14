#!/usr/bin/env node
/**
 * grant-admin.cjs — grant platform admin (User.admin=true) to a real account.
 *
 * 2026-09-13 (Dev): Evan wants his own TireTrader admin access. There is no
 *   separate admin login — isAdmin() is just `user.admin === true` (lib/auth.js).
 *   So admin is a role flag on his EXISTING account: no new secret, no password
 *   created or sent — he logs in with his own password (or /forgot to reset).
 *   This also unblocks founding-seller grants (0/25 claimed only because there
 *   was no admin to grant them).
 *
 * Runs against PROD (needs the Neon DATABASE_URL). Refuses a local file: (SQLite
 * dev) DB unless --allow-dev, so a dev run can't be mistaken for the real thing.
 *
 * SAFE BY DEFAULT — three modes:
 *   LIST  (no --email): print candidate rows (email/name/role/admin/createdAt +
 *         listing count) for accounts matching Evan, so you can SEE which row is
 *         his real seller account before flipping. Also lists current admins.
 *         No writes.
 *   DRY   (--email X, no --confirm): show exactly what would change. No writes.
 *   WRITE (--email X --confirm): set admin=true on that one row, then re-read and
 *         verify. Idempotent: an already-admin row is reported and left as-is.
 *         NEVER touches the password.
 *
 * Usage:
 *   DATABASE_URL="<PROD neon url>" node scripts/grant-admin.cjs
 *   DATABASE_URL="<PROD neon url>" node scripts/grant-admin.cjs --email erlightbourn@gmail.com
 *   DATABASE_URL="<PROD neon url>" node scripts/grant-admin.cjs --email erlightbourn@gmail.com --confirm
 */
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const emailArg = (args.find((a) => a.startsWith("--email=")) || "").split("=")[1] ||
  (args.includes("--email") ? args[args.indexOf("--email") + 1] : "");
const CONFIRM = args.includes("--confirm");
const url = process.env.DATABASE_URL || "";

// Accounts likely to be Evan's — used only in LIST mode to disambiguate.
const CANDIDATE_EMAILS = ["erlightbourn@gmail.com", "erlightbourn+ttqa1@gmail.com"];

const row = (u) =>
  `  ${u.email}  name="${u.name}"  role=${u.role}  admin=${u.admin}  ` +
  `listings=${u._count?.listings ?? "?"}  created=${new Date(u.createdAt).toISOString().slice(0, 10)}`;

async function list(prisma) {
  console.log("CANDIDATE ACCOUNTS (email contains 'erlightbourn' OR name ~ 'Evan Lightbourn'):");
  const candidates = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "erlightbourn" } },
        { name: { contains: "Evan Lightbourn" } },
      ],
    },
    select: { id: true, email: true, name: true, role: true, admin: true, createdAt: true, _count: { select: { listings: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!candidates.length) console.log("  (none found — the real account may use a different email; sign up first, then flip)");
  else candidates.forEach((u) => console.log(row(u)));
  for (const e of CANDIDATE_EMAILS) {
    if (!candidates.some((u) => u.email === e)) console.log(`  (no account under ${e})`);
  }

  const admins = await prisma.user.findMany({
    where: { admin: true },
    select: { id: true, email: true, name: true, role: true, admin: true, createdAt: true, _count: { select: { listings: true } } },
  });
  console.log(`\nCURRENT ADMINS (${admins.length}):`);
  admins.forEach((u) => console.log(row(u)));
  console.log("\nNext: re-run with --email <the-right-one> to preview, then add --confirm to grant.");
}

async function grant(prisma, email) {
  const before = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, admin: true },
  });
  if (!before) {
    console.error(`ABORT: no account under ${email}. Sign up with that email first, then re-run.`);
    process.exit(2);
  }
  console.log(`TARGET: ${before.email}  name="${before.name}"  role=${before.role}  admin=${before.admin}`);
  if (before.admin === true) {
    console.log("-> already admin. Nothing to do (idempotent).");
    return "already";
  }
  if (!CONFIRM) {
    console.log("-> DRY-RUN: would set admin=true (password untouched). Re-run with --confirm to apply.");
    return "would";
  }
  await prisma.user.update({ where: { email }, data: { admin: true } });
  const after = await prisma.user.findUnique({ where: { email }, select: { admin: true } });
  const ok = after.admin === true;
  console.log(`-> AFTER admin=${after.admin} ${ok ? "✅ granted (login with existing password, or /forgot to reset)" : "❌ FAILED"}`);
  return ok ? "granted" : "failed";
}

(async () => {
  if (!url) {
    console.error("ABORT: DATABASE_URL not set. Pass the PROD Neon url.");
    process.exit(2);
  }
  if (url.startsWith("file:") && !args.includes("--allow-dev")) {
    console.error(`ABORT: DATABASE_URL is a local SQLite dev DB (${url}). This is a PROD tool — point it at the Neon url (or --allow-dev to test locally).`);
    process.exit(2);
  }
  const host = (url.match(/@([^/:?]+)/) || [])[1] || "unknown-host";
  console.log(`Target DB host: ${host}  (mode: ${!emailArg ? "LIST" : CONFIRM ? "LIVE WRITE" : "DRY-RUN"})\n`);

  const prisma = new PrismaClient();
  try {
    if (!emailArg) { await list(prisma); process.exit(0); }
    const r = await grant(prisma, emailArg.toLowerCase());
    process.exit(r === "failed" ? 1 : 0);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
