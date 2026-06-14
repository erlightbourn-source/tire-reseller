import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, freeYearFromNow } from "@/lib/auth";
import { isStateAbbr } from "@/lib/states";
import { enforceRateLimit, isEmail, cleanStr, ValidationError, LIMITS } from "@/lib/security";

export async function POST(req) {
  // Limit account creation per IP to curb spam/abuse.
  const limited = enforceRateLimit(req, "signup", { limit: 5, windowMs: 60_000 });
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const isSeller = role === "seller";

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
    },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true, userId: user.id, role: user.role });
}
