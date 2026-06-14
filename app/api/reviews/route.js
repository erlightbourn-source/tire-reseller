import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit, cleanStr, ValidationError, LIMITS } from "@/lib/security";

// Leave (or update) a review for a seller.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to leave a review." }, { status: 401 });

  const limited = enforceRateLimit(req, `review:${user.id}`, { limit: 15, windowMs: 60_000 });
  if (limited) return limited;

  const { sellerId, rating, body } = await req.json();
  if (!sellerId) return NextResponse.json({ error: "Missing seller." }, { status: 400 });
  if (sellerId === user.id) return NextResponse.json({ error: "You can't review yourself." }, { status: 400 });
  const r = Math.round(Number(rating));
  if (!(r >= 1 && r <= 5)) return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });

  let text;
  try { text = cleanStr(body, LIMITS.review, { field: "Review" }); }
  catch (e) { if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 }); throw e; }

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== "seller") return NextResponse.json({ error: "Seller not found." }, { status: 404 });

  await prisma.review.upsert({
    where: { sellerId_authorId: { sellerId, authorId: user.id } },
    update: { rating: r, body: text },
    create: { sellerId, authorId: user.id, rating: r, body: text },
  });
  return NextResponse.json({ ok: true });
}
