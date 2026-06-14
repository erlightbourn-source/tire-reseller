import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { enforceRateLimit, isEmail, clientIp } from "@/lib/security";
import { logAudit } from "@/lib/audit";

const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req) {
  // Throttle credential stuffing / brute force: 8 attempts per IP per minute.
  const limited = await enforceRateLimit(req, "login", { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  const { email, password } = await req.json();
  if (!email || !password || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!isEmail(String(email).toLowerCase()) || password.length > 200) {
    // Generic message — never reveal whether the email exists.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
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
