import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, clientIp } from "@/lib/security";
import { checkTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email";
import { parseFoundingInterest, buildInterestEmail, INTEREST_ACTION, INTEREST_PAGE, INTEREST_INBOX, INTEREST_CONSENT_VERSION } from "@/lib/foundingInterest";

// Founding-seller "rather talk first?" form. A lead is stored (AuditLog row, no schema change) AND emailed to
// the inbox Miles watches. It is NOT added to MailerLite: newsletter consent is a different consent. Success
// means at least one of store/email worked; only both failing is an error, so a lead is never silently lost.
export async function POST(req) {
  // Per-IP throttle first, so junk never reaches the DB or the mail provider.
  const limited = await enforceRateLimit(req, "founding-interest", { limit: 5, windowMs: 60 * 60_000 });
  if (limited) return limited;

  let raw;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const bot = await checkTurnstile(req, raw?.turnstileToken);
  if (bot) return bot;
  const parsed = parseFoundingInterest(raw);
  if (!parsed.ok) {
    return NextResponse.json(parsed.silent ? { ok: true } : { error: parsed.error }, { status: parsed.status });
  }
  const { name, contact, kind } = parsed.data;

  // Per-contact cap: the same person resubmitting doesn't multiply the inbox noise.
  const dupLimited = await enforceRateLimit(req, "founding-interest-contact", { key: contact, limit: 2, windowMs: 24 * 60 * 60_000 });
  if (dupLimited) return dupLimited;

  const at = new Date();
  const [stored, sent] = await Promise.all([
    prisma.auditLog
      .create({
        data: {
          action: INTEREST_ACTION,
          ip: clientIp(req) || null,
          meta: JSON.stringify({ name, contact, kind, page: INTEREST_PAGE, consent: INTEREST_CONSENT_VERSION }).slice(0, 1000),
          createdAt: at,
        },
      })
      .then(() => true)
      .catch((e) => { console.error("founding-interest: store failed", e?.name); return false; }),
    sendEmail({ to: INTEREST_INBOX, ...buildInterestEmail({ name, contact, kind, at }) }),
  ]);
  if (!stored && !sent) {
    return NextResponse.json({ error: "That didn't go through. Try again, or tap Claim your spot to sign up directly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
