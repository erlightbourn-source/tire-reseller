import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { enforceRateLimit, isEmail } from "@/lib/security";

export async function POST(req) {
  // Throttle credential stuffing / brute force: 8 attempts per IP per minute.
  const limited = enforceRateLimit(req, "login", { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  const { email, password } = await req.json();
  if (!email || !password || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!isEmail(String(email).toLowerCase()) || password.length > 200) {
    // Generic message — never reveal whether the email exists.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, userId: user.id });
}
