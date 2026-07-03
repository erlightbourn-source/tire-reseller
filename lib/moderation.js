import "server-only";
import { prisma } from "@/lib/db";

// Single source of truth for the report-driven auto-hide rule, so the report
// endpoint (which hides) and account reactivation (which restores) can't drift.
export const AUTO_HIDE_AT = 5; // distinct, non-throwaway reporters before auto-hide
export const MIN_REPORTER_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000; // reporters must be >24h old to count

/** Count reports from established (>24h-old) reporter accounts. */
export async function credibleReportCount(listingId) {
  const cutoff = new Date(Date.now() - MIN_REPORTER_ACCOUNT_AGE_MS);
  return prisma.report.count({
    where: { listingId, reporter: { createdAt: { lt: cutoff } } },
  });
}

/** Of the given listings, return the set of ids that meet the auto-hide
 *  threshold — one grouped query, no per-listing round trips. */
export async function autoHiddenIds(listingIds) {
  if (!listingIds.length) return new Set();
  const cutoff = new Date(Date.now() - MIN_REPORTER_ACCOUNT_AGE_MS);
  const groups = await prisma.report.groupBy({
    by: ["listingId"],
    where: { listingId: { in: listingIds }, reporter: { createdAt: { lt: cutoff } } },
    _count: { _all: true },
  });
  return new Set(groups.filter((g) => g._count._all >= AUTO_HIDE_AT).map((g) => g.listingId));
}
