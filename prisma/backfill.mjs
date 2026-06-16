// Backfill the denormalized columns added for indexed browse queries:
//   Listing.widthMm/aspectRatio/rimDiameter/treadDepth32/perTireCents/sellerPro
//   User.ratingAvg/ratingCount
// Idempotent — safe to re-run. Used by the seed and runnable standalone after a
// deploy that adds these columns:  `node prisma/backfill.mjs`  (or `npm run backfill`).
import { PrismaClient } from "@prisma/client";
import { deriveListingColumns } from "../lib/tiresize.js";

export async function backfillDenorm(prisma) {
  const listings = await prisma.listing.findMany({
    select: {
      id: true, size: true, treadDepth: true, priceCents: true, quantity: true,
      seller: { select: { pro: true } },
    },
  });
  for (const l of listings) {
    await prisma.listing.update({
      where: { id: l.id },
      data: { ...deriveListingColumns(l), sellerPro: !!l.seller?.pro },
    });
  }

  const grouped = await prisma.review.groupBy({ by: ["sellerId"], _avg: { rating: true }, _count: { _all: true } });
  const rated = [];
  for (const g of grouped) {
    rated.push(g.sellerId);
    await prisma.user.update({
      where: { id: g.sellerId },
      data: { ratingAvg: g._avg.rating || 0, ratingCount: g._count._all },
    });
  }
  // Zero out any seller whose reviews were all removed.
  await prisma.user.updateMany({ where: { id: { notIn: rated } }, data: { ratingAvg: 0, ratingCount: 0 } });

  return { listings: listings.length, ratedSellers: grouped.length };
}

// Standalone runner.
if (import.meta.url === `file://${process.argv[1]}`) {
  const prisma = new PrismaClient();
  backfillDenorm(prisma)
    .then((r) => console.log("Backfilled denormalized columns:", r))
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
