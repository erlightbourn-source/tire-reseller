import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newResetToken } from "@/lib/auth";
import { enforceRateLimit, isEmail } from "@/lib/security";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

// Resend the account-verification email. Neutral response (no existence oracle).
export async function POST(req) {
  const limited = await enforceRateLimit(req, "resend-verify", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email } = await req.json();
  const addr = String(email || "").toLowerCase();
  const NEUTRAL = NextResponse.json({ ok: true });
  if (!isEmail(addr)) return NEUTRAL;

  const user = await prisma.user.findUnique({ where: { email: addr } });
  if (user && !user.emailVerified) {
    const { token, hash } = newResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyTokenHash: hash, verifyTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS) },
    });
    await sendEmail({
      to: addr,
      subject: "Confirm your TireTrader account",
      text: `Confirm your email to finish signing up:\n\n${SITE_URL}/api/auth/verify?token=${token}\n\nThis link expires in 24 hours.`,
    });
  }
  return NEUTRAL;
}
