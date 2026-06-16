import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { enforceRateLimit, isEmail, clientIp } from "@/lib/security";
import { logAudit } from "@/lib/audit";

const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

// A valid bcrypt hash we compare against when the email doesn't exist, so the
// request does the same ~bcrypt-cost work as a real lookup. Without this, a
// missing email returns in microseconds and leaks account existence via timing.
const DUMMY_HASH = "$2a$10$UEL5a3PKxBSiLOP1U/2yQO44y9Yn3PCKxrwDyLU6uJVsZ7Fs/i7me";

export async function POST(req) {
  // Throttle credential stuffing / brute force: 8 attempts per IP per minute.
  const limited = await enforceRateLimit(req, "login", { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  const { email, password } = await req.json();
  if (!email || !password || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const lowerEmail = String(email).toLowerCase();
  if (!isEmail(lowerEmail) || password.length > 200) {
    // Generic message — never reveal whether the email exists.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Also throttle per-account so a botnet spreading across IPs can't brute one
  // account: 10 attempts per email per minute.
  const acctLimited = await enforceRateLimit(req, "login-acct", { key: lowerEmail, limit: 10, windowMs: 60_000 });
  if (acctLimited) return acctLimited;

  const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
  // Constant-work: always run a bcrypt compare (dummy hash when no user) so the
  // response time doesn't reveal whether the email is registered.
  const ok = await verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Soft-deleted accounts: reactivate if still within the 7-day grace window,
  // otherwise refuse (a purge job removes them after grace).
  let reactivated = false;
  if (user.deletedAt) {
    if (Date.now() - new Date(user.deletedAt).getTime() <= GRACE_MS) {
      await prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } });
      // Restore listings hidden by the soft-delete, but leave any that were
      // auto-hidden by reports (>=3) hidden.
      const hidden = await prisma.listing.findMany({
        where: { sellerId: user.id, hidden: true },
        select: { id: true, _count: { select: { reports: true } } },
      });
      const restore = hidden.filter((l) => l._count.reports < 3).map((l) => l.id);
      if (restore.length) await prisma.listing.updateMany({ where: { id: { in: restore } }, data: { hidden: false } });
      reactivated = true;
    } else {
      return NextResponse.json({ error: "This account has been deleted." }, { status: 403 });
    }
  }

  await createSession(user.id, user.tokenVersion);
  await logAudit("login", { userId: user.id, ip: clientIp(req), meta: reactivated ? { reactivated: true } : null });
  return NextResponse.json({ ok: true, userId: user.id, reactivated });
}
