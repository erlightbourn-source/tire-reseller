import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";

const REASONS = ["spam", "scam", "prohibited", "wrong category", "other"];
const AUTO_HIDE_AT = 5; // distinct, non-throwaway reporters before auto-hide
const MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000; // reporters must be >24h old to count

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to report." }, { status: 401 });

  // Rate-limit reporting so a few accounts can't spray takedowns.
  const limited = await enforceRateLimit(req, `report:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const { listingId, reason } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  const r = REASONS.includes(reason) ? reason : "other";

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (listing.sellerId === user.id) return NextResponse.json({ error: "You can't report your own listing." }, { status: 400 });

  await prisma.report.upsert({
    where: { listingId_reporterId: { listingId, reporterId: user.id } },
    update: { reason: r },
    create: { listingId, reporterId: user.id, reason: r },
  });

  // Auto-hide only on enough reports from established accounts, so a burst of
  // freshly-minted throwaways can't brigade a competitor's listing offline.
  const cutoff = new Date(Date.now() - MIN_ACCOUNT_AGE_MS);
  const credibleReports = await prisma.report.count({
    where: { listingId, reporter: { createdAt: { lt: cutoff } } },
  });
  if (credibleReports >= AUTO_HIDE_AT && !listing.hidden) {
    await prisma.listing.update({ where: { id: listingId }, data: { hidden: true } });
  }
  return NextResponse.json({ ok: true });
}
