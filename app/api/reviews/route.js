import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Leave (or update) a review for a seller.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to leave a review." }, { status: 401 });

  const { sellerId, rating, body } = await req.json();
  if (!sellerId) return NextResponse.json({ error: "Missing seller." }, { status: 400 });
  if (sellerId === user.id) return NextResponse.json({ error: "You can't review yourself." }, { status: 400 });
  const r = Math.round(Number(rating));
  if (!(r >= 1 && r <= 5)) return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== "seller") return NextResponse.json({ error: "Seller not found." }, { status: 404 });

  await prisma.review.upsert({
    where: { sellerId_authorId: { sellerId, authorId: user.id } },
    update: { rating: r, body: body?.trim() || null },
    create: { sellerId, authorId: user.id, rating: r, body: body?.trim() || null },
  });
  return NextResponse.json({ ok: true });
}
