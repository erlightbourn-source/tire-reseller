import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { userId } = await req.json();
  if (!userId || userId === user.id) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    update: {},
    create: { blockerId: user.id, blockedId: userId },
  });
  return NextResponse.json({ ok: true, blocked: true });
}

export async function DELETE(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { userId } = await req.json();
  await prisma.block
    .delete({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } } })
    .catch(() => {});
  return NextResponse.json({ ok: true, blocked: false });
}
