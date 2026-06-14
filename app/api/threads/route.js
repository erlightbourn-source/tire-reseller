import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Create (or fetch existing) a buyer↔seller thread for a listing.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to message sellers." }, { status: 401 });

  const { listingId, message } = await req.json();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (listing.sellerId === user.id)
    return NextResponse.json({ error: "You can't message yourself about your own listing." }, { status: 400 });

  // Block check (either direction)
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: listing.sellerId },
        { blockerId: listing.sellerId, blockedId: user.id },
      ],
    },
  });
  if (block) return NextResponse.json({ error: "You can't message this seller." }, { status: 403 });

  const thread = await prisma.thread.upsert({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
    update: {},
    create: { listingId, buyerId: user.id, sellerId: listing.sellerId },
  });

  if (message && message.trim()) {
    await prisma.message.create({
      data: { threadId: thread.id, senderId: user.id, body: message.trim() },
    });
    await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, threadId: thread.id });
}
