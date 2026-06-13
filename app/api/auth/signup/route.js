import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, freeYearFromNow } from "@/lib/auth";
import { isStateAbbr } from "@/lib/states";

export async function POST(req) {
  const { email, password, name, location, role, state } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const isSeller = role === "seller";

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
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
