import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, freeYearFromNow, newResetToken } from "@/lib/auth";
import { isStateAbbr } from "@/lib/states";
import { enforceRateLimit, isEmail, cleanStr, ValidationError, LIMITS, clientIp } from "@/lib/security";
import { isPasswordPwned } from "@/lib/breach";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { logAudit } from "@/lib/audit";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req) {
  // Limit account creation per IP to curb spam/abuse.
  const limited = await enforceRateLimit(req, "signup", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const body = await req.json();
  const { password, role, state } = body;

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
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Tell the real owner someone tried to sign up — don't leak existence to the requester.
    await sendEmail({
      to: email,
      subject: "You already have a TireTrader account",
      text: `Someone tried to sign up with this email. You already have an account — just log in:\n\n${SITE_URL}/login\n\nForgot your password? ${SITE_URL}/forgot`,
    });
    return NEUTRAL;
  }

  const isSeller = role === "seller";
  const { token: verifyToken, hash: verifyTokenHash } = newResetToken();
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      name,
      location: location || null,
      state: isStateAbbr(state) ? state.toUpperCase() : null,
      role: isSeller ? "seller" : "buyer",
      // Sellers get their first year free — no charge until this date.
      sellerFreeUntil: isSeller ? freeYearFromNow() : null,
      emailVerified: false,
      verifyTokenHash,
      verifyTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  await sendEmail({
    to: email,
    subject: "Confirm your TireTrader account",
    text: `Welcome to TireTrader! Confirm your email to finish signing up:\n\n${SITE_URL}/api/auth/verify?token=${verifyToken}\n\nThis link expires in 24 hours.`,
  });
  await logAudit("signup", { userId: user.id, ip: clientIp(req), meta: { role: user.role } });
  // In dev (no email provider) surface the link so the flow is testable.
  const devLink = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
    ? `${SITE_URL}/api/auth/verify?token=${verifyToken}`
    : undefined;
  return NextResponse.json({ ok: true, pending: true, devLink });
}
