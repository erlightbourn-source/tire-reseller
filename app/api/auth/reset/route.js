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
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hash, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  // Set the new password, clear the token, and revoke all existing sessions.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetTokenHash: null,
      resetTokenExpiry: null,
      tokenVersion: { increment: 1 },
    },
    select: { id: true, tokenVersion: true },
  });

  // Log the user in on this device with a fresh session.
  await createSession(updated.id, updated.tokenVersion);
  await logAudit("password_reset", { userId: updated.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
