import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newResetToken } from "@/lib/auth";
import { sendEmail, emailConfigured } from "@/lib/email";
import { enforceRateLimit, isEmail } from "@/lib/security";
import { SITE_URL } from "@/lib/site";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req) {
  const limited = await enforceRateLimit(req, "forgot", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email } = await req.json();
  const addr = String(email || "").trim().toLowerCase();

  // Generic response either way — never reveal whether an account exists.
  const generic = { ok: true };

  if (!isEmail(addr)) return NextResponse.json(generic);

  // Per-recipient cap (3/hour) so an IP-rotating attacker can't bomb one
  // victim's inbox with reset emails. Keyed on the normalized address.
  const addrLimited = await enforceRateLimit(req, "forgot-addr", { key: addr, limit: 3, windowMs: 60 * 60 * 1000 });
  if (addrLimited) return addrLimited;

  const user = await prisma.user.findUnique({ where: { email: addr } });
  if (!user) return NextResponse.json(generic);

  const { token, hash } = newResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hash, resetTokenExpiry: new Date(Date.now() + TTL_MS) },
  });

  // SECURITY: build the reset link from the trusted, configured site URL — NEVER
  // from request headers. `Host` / `X-Forwarded-Host` are attacker-controlled, so
  // deriving the link from them lets anyone request a reset for a victim's address
  // and have us email that victim a VALID reset token pointing at the attacker's
  // domain (password-reset host-header poisoning → account takeover; the mail is
  // genuinely ours, so it passes SPF/DKIM and looks legitimate).
  // Every other email link in this app already uses SITE_URL (signup,
  // resend-verification, alerts, unsubscribe) — this route was the last holdout.
  // Local dev stays clickable via NEXT_PUBLIC_SITE_URL, which .env.example sets.
  const link = `${SITE_URL}/reset?token=${token}`;

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
