import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newResetToken } from "@/lib/auth";
import { sendEmail, emailConfigured } from "@/lib/email";
import { enforceRateLimit, isEmail } from "@/lib/security";
import { SITE_URL } from "@/lib/site";
import { checkTurnstile } from "@/lib/turnstile";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req) {
  const limited = await enforceRateLimit(req, "forgot", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email, turnstileToken } = await req.json();
  const bot = await checkTurnstile(req, turnstileToken);
  if (bot) return bot;
  const addr = String(email || "").trim().toLowerCase();

  // Generic response either way — never reveal whether an account exists.
  const generic = { ok: true };

  if (!isEmail(addr)) return NextResponse.json(generic);

  // Per-recipient cap (3/hour) so an IP-rotating attacker can't bomb one
  // victim's inbox with reset emails. Keyed on the normalized address.
  const addrLimited = await enforceRateLimit(req, "forgot-addr", { key: addr, limit: 3, windowMs: 60 * 60 * 1000 });
  if (addrLimited) return addrLimited;

  // Timing: an existing account costs a DB write + an email send, an unknown one
  // returns at once, so latency revealed whether an account exists. On Cloudflare
  // the work runs after the response (waitUntil) and both paths answer alike.
  const { token, hash } = newResetToken();
  const link = `${SITE_URL}/reset?token=${token}`;
  const work = sendReset(addr, hash, link);
  const ctx = await cfCtx();
  if (ctx?.waitUntil) {
    ctx.waitUntil(work.catch((e) => console.error("forgot: send failed", e?.message)));
    return NextResponse.json(generic);
  }
  const sent = await work;

  // In dev (no email provider), surface the link so the flow is testable.
  if (sent && process.env.NODE_ENV !== "production" && !emailConfigured()) {
    return NextResponse.json({ ...generic, devLink: link });
  }
  return NextResponse.json(generic);
}

async function cfCtx() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return getCloudflareContext()?.ctx || null;
  } catch {
    return null;
  }
}

// Returns true when a reset mail went out (the account exists).
async function sendReset(addr, hash, link) {
  const user = await prisma.user.findUnique({ where: { email: addr } });
  if (!user) return false;

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
  await sendEmail({
    to: addr,
    subject: "Reset your TireKind password",
    text: `Someone requested a password reset for your TireKind account.\n\nReset it here (valid for 1 hour):\n${link}\n\nIf this wasn't you, you can ignore this email.`,
  });
  return true;
}
