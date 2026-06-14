import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const REASONS = ["spam", "scam", "prohibited", "wrong category", "other"];
const AUTO_HIDE_AT = 3;

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to report." }, { status: 401 });

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

  const count = await prisma.report.count({ where: { listingId } });
  if (count >= AUTO_HIDE_AT && !listing.hidden) {
    await prisma.listing.update({ where: { id: listingId }, data: { hidden: true } });
  }
  return NextResponse.json({ ok: true });
}
