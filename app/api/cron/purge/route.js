import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bearerMatches } from "@/lib/security";

export const dynamic = "force-dynamic";

const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

// Permanently remove accounts whose 7-day soft-delete grace has elapsed.
// Bearer-gated (CRON_SECRET); fails closed if unset.
export async function GET(req) {
  if (!bearerMatches(req, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - GRACE_MS);
  const stale = await prisma.user.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true },
    take: 500,
  });

  if (!stale.length) return NextResponse.json({ ok: true, purged: 0 });

  const ids = stale.map((u) => u.id);

  // Reviews these users *wrote* will be cascade-deleted along with them, so the
  // denormalized ratingAvg/ratingCount on the sellers they reviewed would drift
  // (stale, inflated counts). Capture those sellers BEFORE the delete, then
  // recompute their aggregates after, so the browse minRating filter and seller
  // cards keep reading accurate columns.
  const affected = await prisma.review.findMany({
    where: { authorId: { in: ids } },
    select: { sellerId: true },
    distinct: ["sellerId"],
  });
  const sellerIds = affected.map((r) => r.sellerId).filter((sid) => !ids.includes(sid));

  // Cascades remove listings, threads, messages, favorites, reviews, etc. (FKs).
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  for (const sid of sellerIds) {
    const agg = await prisma.review.aggregate({
      where: { sellerId: sid },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.user.update({
      where: { id: sid },
      data: { ratingAvg: agg._avg.rating || 0, ratingCount: agg._count._all },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, purged: stale.length, ratingsRecomputed: sellerIds.length });
}
