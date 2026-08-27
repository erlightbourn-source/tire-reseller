import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * ONE-TIME, token-guarded PROD remediation for the leaked demo admin account.
 *
 * The seed shipped demo@tiretrader.test / demo1234 with admin:true, and those
 * credentials were public for weeks (PR #22 only hid the launch banner). This
 * endpoint runs the neutralize in the Vercel serverless runtime, where
 * process.env.DATABASE_URL IS the prod Neon string — so the secret never leaves
 * Evan's infra and nobody has to paste it anywhere.
 *
 * GUARD: only the SHA-256 HASH of a random token is committed here; the endpoint
 * runs iff sha256(?token=) matches (timing-safe). The plaintext token is handed to
 * an operator out-of-band and relayed to Evan as a single tap-to-run link.
 *
 * SAFE: scoped to the ONE demo account — it cannot read or mutate any other data.
 * IDEMPOTENT + SELF-NEUTRALIZING: once the account is admin=false AND "demo1234" no
 * longer authenticates, further calls perform NO mutation and return "already-
 * neutralized". (So a link-preview crawler triggering it early is harmless.)
 *
 * REMOVE THIS ROUTE after Evan confirms the kill (follow-up PR) — do not leave a
 * standing remediation surface in the app.
 */

// sha256(plaintext token), hex. Plaintext is NOT in the repo (handed off out-of-band).
const TOKEN_SHA256 = "67a8bbabf85b80b486364b7b00436659c58eac08635768f3884f6fd5ea207686";
const DEMO_EMAIL = "demo@tiretrader.test";
const PUBLIC_PW = "demo1234";

function tokenOk(token) {
  if (!token) return false;
  const got = crypto.createHash("sha256").update(String(token)).digest("hex");
  const a = Buffer.from(got, "hex");
  const b = Buffer.from(TOKEN_SHA256, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (!tokenOk(token)) {
    // Do not reveal that this endpoint exists to an unauthorized caller.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, email: true, role: true, admin: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ status: "not-found", note: `no ${DEMO_EMAIL} row (already deleted)` });
  }

  const publicWorkedBefore = await verifyPassword(PUBLIC_PW, user.passwordHash);
  if (user.admin === false && !publicWorkedBefore) {
    return NextResponse.json({
      status: "already-neutralized",
      verified: { admin: false, demo1234Authenticates: false },
      note: "no mutation performed (idempotent)",
    });
  }

  // Rotate the password to an unguessable value in the app's own hashing scheme
  // (sha256 pre-hash -> bcrypt) and drop admin. "demo1234" stops authenticating.
  const secret = crypto.randomBytes(32).toString("hex");
  const newHash = await hashPassword(secret);
  await prisma.user.update({
    where: { email: DEMO_EMAIL },
    data: { admin: false, passwordHash: newHash },
  });

  const after = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { admin: true, passwordHash: true },
  });
  const publicWorksAfter = await verifyPassword(PUBLIC_PW, after.passwordHash);

  return NextResponse.json({
    status: "neutralized",
    before: { admin: user.admin, demo1234Authenticated: publicWorkedBefore },
    after: { admin: after.admin, demo1234Authenticates: publicWorksAfter },
    verified: after.admin === false && publicWorksAfter === false,
  });
}
