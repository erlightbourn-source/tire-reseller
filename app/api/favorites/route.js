import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";

const LIMIT = { limit: 60, windowMs: 60_000 }; // per account; a heart-button spam ceiling

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to save listings." }, { status: 401 });
  const limited = await enforceRateLimit(req, "fav", { key: user.id, ...LIMIT });
  if (limited) return limited;
  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listing." }, { status: 400 });

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: user.id, listingId } },
    update: {},
    create: { userId: user.id, listingId },
  });
  return NextResponse.json({ ok: true, favorited: true });
}

export async function DELETE(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to manage saved listings." }, { status: 401 });
  const limited = await enforceRateLimit(req, "fav", { key: user.id, ...LIMIT });
  if (limited) return limited;
  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listing." }, { status: 400 });

  await prisma.favorite
    .delete({ where: { userId_listingId: { userId: user.id, listingId } } })
    .catch(() => {});
  return NextResponse.json({ ok: true, favorited: false });
}
