import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";

// Upgrade to / cancel Pro. (Simulated billing for the demo; wire to Stripe in prod.)
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!canSell(user)) return NextResponse.json({ error: "Become a seller first.", code: "become_seller" }, { status: 402 });
  await prisma.user.update({ where: { id: user.id }, data: { pro: true } });
  return NextResponse.json({ ok: true, pro: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { pro: false } });
  return NextResponse.json({ ok: true, pro: false });
}
