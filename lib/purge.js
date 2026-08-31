// Account cleanup used by the daily /api/cron/purge job. Two populations of stale
// rows are removed in one pass so the purge has a single source of truth:
//
//   1. SOFT-DELETED accounts whose 7-day self-serve deletion grace has elapsed
//      (deletedAt < now - 7d). This is the pre-existing behavior.
//   2. ABANDONED UNVERIFIED signups (emailVerified false, created > 7d ago). An
//      unverified account can never log in (login is blocked until verification),
//      so it can never reach the self-serve DELETE flow — without this it would
//      accumulate forever. The verify link itself expires in 24h (signup route),
//      so 7 days is a generous abandon window; a legitimate late verifier just
//      re-signs up (the signup existence-check is neutral, so no leak).
//
// User FKs are all onDelete: Cascade (listings, threads, messages, favorites,
// reviews, reports, blocks), and AuditLog.userId is nullable, so a hard delete is
// clean. Unverified rows have no related content (can't log in), so their delete
// touches nothing else; the rating-recompute below only ever matters for a
// soft-deleted VERIFIED user who wrote reviews.
const SOFT_DELETE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const UNVERIFIED_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

// Bounded batch: at most 500 rows per run so a huge backlog can't blow up a single
// cron invocation — the remainder drains on the next daily run (not silently
// dropped). Mirrors the original purge cap.
const BATCH = 500;

export async function purgeStaleUsers(prisma, now = Date.now()) {
  const softCutoff = new Date(now - SOFT_DELETE_GRACE_MS);
  const unverifiedCutoff = new Date(now - UNVERIFIED_GRACE_MS);

  const stale = await prisma.user.findMany({
    where: {
      OR: [
        // 1. soft-deleted, grace elapsed
        { deletedAt: { lt: softCutoff } },
        // 2. abandoned unverified signup
        { emailVerified: false, createdAt: { lt: unverifiedCutoff } },
      ],
    },
    select: { id: true },
    take: BATCH,
  });

  if (!stale.length) return { ok: true, purged: 0, ratingsRecomputed: 0 };

  const ids = stale.map((u) => u.id);

  // Reviews these users *wrote* will be cascade-deleted along with them, so the
  // denormalized ratingAvg/ratingCount on the sellers they reviewed would drift
  // (stale, inflated counts). Capture those sellers BEFORE the delete, then
  // recompute their aggregates after, so the browse minRating filter and seller
  // cards keep reading accurate columns. (Unverified rows contribute nothing here
  // — they can't write reviews — so this only fires for soft-deleted authors.)
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

  return { ok: true, purged: stale.length, ratingsRecomputed: sellerIds.length };
}
