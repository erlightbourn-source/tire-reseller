import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, freeYearFromNow, newResetToken } from "@/lib/auth";
import { isStateAbbr } from "@/lib/states";
import { enforceRateLimit, isEmail, cleanStr, ValidationError, LIMITS, clientIp } from "@/lib/security";
import { isPasswordPwned } from "@/lib/breach";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { logAudit } from "@/lib/audit";
import { LAST_UPDATED } from "@/lib/legal";
import { SRC_COOKIE, decodeSource } from "@/lib/attribution";
import { checkTurnstile } from "@/lib/turnstile";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req) {
  // Limit account creation per IP to curb spam/abuse.
  const limited = await enforceRateLimit(req, "signup", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const body = await req.json();
  const { password, role, state } = body;

  // Bot check before any DB, bcrypt or email work.
  const bot = await checkTurnstile(req, body.turnstileToken);
  if (bot) return bot;

  // Click-through consent gate: require explicit agreement to the Terms of
  // Service + Privacy Policy before an account can be created. Enforced here on
  // the server — the signup form's checkbox is UX, never the security boundary.
  if (body.agreedToTerms !== true) {
    return NextResponse.json(
      { error: "Please agree to the Terms of Service and Privacy Policy to create an account." },
      { status: 400 }
    );
  }

  let email, name, location;
  try {
    name = cleanStr(body.name, LIMITS.name, { required: true, field: "Name" });
    location = cleanStr(body.location, LIMITS.location, { field: "Location" });
    email = cleanStr(body.email, LIMITS.email, { required: true, field: "Email" });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  email = email.toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (password.length > 200) {
    return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  }
  if (await isPasswordPwned(password)) {
    return NextResponse.json(
      { error: "That password has appeared in a data breach. Please choose a different one." },
      { status: 400 }
    );
  }

  // Neutral, identical response whether or not the email is already taken — no
  // account-existence oracle. New accounts are created UNVERIFIED and must click
  // an emailed link before they can log in (double opt-in).
  const NEUTRAL = NextResponse.json({ ok: true, pending: true });

  // Per-recipient cap (3/hour), applied BEFORE the existence lookup so it is
  // identical for taken and free addresses. The per-IP limit above doesn't stop
  // an IP-rotating attacker from bombing a victim with "You already have a
  // TireKind account" mail — the gap forgot/resend-verification closed in 8b2be88.
  const addrLimited = await enforceRateLimit(req, "signup-addr", { key: email, limit: 3, windowMs: 60 * 60 * 1000 });
  if (addrLimited) return addrLimited;

  // Hash BEFORE the lookup so both branches pay the same bcrypt cost (~250 ms at
  // cost 12). Previously only the new-account branch hashed, so a taken email
  // answered ~200 ms faster — a timing oracle that undid the neutral response.
  const passwordHash = await hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  const isSeller = role === "seller";
  const { token: verifyToken, hash: verifyTokenHash } = newResetToken();
  const pendingData = {
    passwordHash,
    name,
    location: location || null,
    state: isStateAbbr(state) ? state.toUpperCase() : null,
    role: isSeller ? "seller" : "buyer",
    // Sellers list free during launch — no charge until this date (lib/pricing.js).
    sellerFreeUntil: isSeller ? freeYearFromNow() : null,
    emailVerified: false,
    verifyTokenHash,
    verifyTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS),
  };

  // Pre-hijack guard (audit L1624 F4). An UNVERIFIED account proves nothing about
  // who owns the address, so a second signup for it must not pick the password:
  // whoever sent it may be the attacker or the real owner, and either may be the
  // one who signed up first. So this request's password is never stored. Instead
  // the old confirm link dies, and the inbox gets a single "choose your password"
  // link; only the mailbox owner can finish, and the password they choose there
  // is the one that sticks (app/api/auth/reset marks the email verified).
  if (existing && !existing.emailVerified && !existing.deletedAt) {
    const { token: setToken, hash: setHash } = newResetToken();
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        verifyTokenHash: null,
        verifyTokenExpiry: null,
        resetTokenHash: setHash,
        resetTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS),
        tokenVersion: { increment: 1 },
      },
    });
    await sendEmail({
      to: email,
      subject: "Finish creating your TireKind account",
      text:
        `Someone started a TireKind signup with this email. To finish it, choose your password here:\n\n` +
        `${SITE_URL}/reset?token=${setToken}\n\nThis link expires in 24 hours. Earlier confirmation links for this address no longer work.\n\n` +
        `Didn't sign up for TireKind? Don't click the link. Just ignore this email and no account will be created.`,
    });
    await logAudit("signup_pending_retry", { userId: existing.id, ip: clientIp(req) });
    return NEUTRAL;
  }

  if (existing) {
    // Tell the real owner someone tried to sign up — don't leak existence to the requester.
    await sendEmail({
      to: email,
      subject: "You already have a TireKind account",
      text: `Someone tried to sign up with this email. You already have an account — just log in:\n\n${SITE_URL}/login\n\nForgot your password? ${SITE_URL}/forgot`,
    });
    return NEUTRAL;
  }

  const user = await prisma.user.create({ data: { email, ...pendingData } });

  await sendConfirm(email, verifyToken);
  // Record the consent event (who/when/which terms version) for a defensible
  // click-through trail without a schema change — it lives in the audit log.
  await logAudit("signup", {
    userId: user.id,
    ip: clientIp(req),
    // First-touch source (utm_* / outside referrer) from the tt_src cookie; null for direct visitors.
    meta: { role: user.role, agreedToTerms: true, termsVersion: LAST_UPDATED,
            source: decodeSource(req.cookies?.get?.(SRC_COOKIE)?.value) },
  });
  // In dev (no email provider) surface the link so the flow is testable.
  const devLink = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
    ? `${SITE_URL}/api/auth/verify?token=${verifyToken}`
    : undefined;
  return NextResponse.json({ ok: true, pending: true, devLink });
}

function sendConfirm(email, verifyToken) {
  return sendEmail({
    to: email,
    subject: "Confirm your TireKind account",
    // The "didn't sign up" line matters: confirming someone else's signup hands
    // them a verified account on your address (see the pre-hijack note above).
    text: `Welcome to TireKind! Confirm your email to finish signing up:\n\n${SITE_URL}/api/auth/verify?token=${verifyToken}\n\nThis link expires in 24 hours.\n\nDidn't sign up for TireKind? Don't click the link. Just ignore this email and no account will be created.`,
  });
}
