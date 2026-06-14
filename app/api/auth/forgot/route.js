import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newResetToken } from "@/lib/auth";
import { sendEmail, emailConfigured } from "@/lib/email";
import { enforceRateLimit, isEmail } from "@/lib/security";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req) {
  const limited = enforceRateLimit(req, "forgot", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email } = await req.json();
  const addr = String(email || "").toLowerCase();

  // Generic response either way — never reveal whether an account exists.
  const generic = { ok: true };

  if (!isEmail(addr)) return NextResponse.json(generic);

  const user = await prisma.user.findUnique({ where: { email: addr } });
  if (!user) return NextResponse.json(generic);

  const { token, hash } = newResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hash, resetTokenExpiry: new Date(Date.now() + TTL_MS) },
  });

  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const link = `${proto}://${host}/reset?token=${token}`;

  await sendEmail({
    to: addr,
    subject: "Reset your TireTrader password",
    text: `Someone requested a password reset for your TireTrader account.\n\nReset it here (valid for 1 hour):\n${link}\n\nIf this wasn't you, you can ignore this email.`,
  });

  // In dev (no email provider), surface the link so the flow is testable.
  if (process.env.NODE_ENV !== "production" && !emailConfigured()) {
    return NextResponse.json({ ...generic, devLink: link });
  }
  return NextResponse.json(generic);
}
