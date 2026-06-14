import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit, cleanStr, ValidationError, LIMITS } from "@/lib/security";

// Create (or fetch existing) a buyer↔seller thread for a listing.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to message sellers." }, { status: 401 });

  const limited = await enforceRateLimit(req, `thread:${user.id}`, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const raw = await req.json();
  const { listingId } = raw;
  let message;
  try { message = cleanStr(raw.message, LIMITS.message, { field: "Message" }); }
  catch (e) { if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 }); throw e; }
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

  if (message) {
    await prisma.message.create({
      data: { threadId: thread.id, senderId: user.id, body: message },
    });
    await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, threadId: thread.id });
}
