import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildListingWhere } from "@/lib/listingFilter";

const OFFER_TTL_MS = 48 * 60 * 60 * 1000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unreadMessages: 0, pendingOffers: 0, newMatches: 0, total: 0 });

  const unreadMessages = await prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: user.id },
      thread: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    },
  });

  // Pending offers I've received (not expired)
  const offerMsgs = await prisma.message.findMany({
    where: {
      kind: "offer",
      offerStatus: "pending",
      senderId: { not: user.id },
      thread: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    },
    select: { createdAt: true },
  });
  const pendingOffers = offerMsgs.filter((m) => Date.now() - new Date(m.createdAt).getTime() <= OFFER_TTL_MS).length;

  // New listings matching my saved searches since I last viewed each
  const searches = await prisma.savedSearch.findMany({ where: { userId: user.id } });
  let newMatches = 0;
  for (const s of searches) {
    const params = Object.fromEntries(new URLSearchParams(s.query));
    const AND = buildListingWhere(params);
    AND.push({ createdAt: { gt: s.lastSeenAt } });
    newMatches += await prisma.listing.count({ where: { AND } });
  }

  return NextResponse.json({
    unreadMessages,
    pendingOffers,
    newMatches,
    total: unreadMessages + pendingOffers + newMatches,
  });
}
