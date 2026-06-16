import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashResetToken, hashPassword, createSession } from "@/lib/auth";
import { enforceRateLimit, clientIp } from "@/lib/security";
import { isPasswordPwned } from "@/lib/breach";
import { logAudit } from "@/lib/audit";

export async function POST(req) {
  const limited = await enforceRateLimit(req, "reset", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const { token, password } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (password.length > 200) return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  if (await isPasswordPwned(password)) {
    return NextResponse.json(
      { error: "That password has appeared in a data breach. Please choose a different one." },
      { status: 400 }
    );
  }

  const hash = hashResetToken(token);
  const now = new Date();
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hash, resetTokenExpiry: { gt: now } },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  // Atomically claim the token: the `resetTokenHash: hash` guard means only ONE
  // concurrent request can win (the first nulls the hash; the rest match 0 rows).
  // This closes the find-then-update TOCTOU that allowed a token to be used twice.
  const newHash = await hashPassword(password);
  const claim = await prisma.user.updateMany({
    where: { id: user.id, resetTokenHash: hash, resetTokenExpiry: { gt: now } },
    data: {
      passwordHash: newHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
      tokenVersion: { increment: 1 },
    },
  });
  if (claim.count === 0) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  // Log the user in on this device with the post-increment tokenVersion.
  const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { tokenVersion: true } });
  await createSession(user.id, fresh.tokenVersion);
  await logAudit("password_reset", { userId: user.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
