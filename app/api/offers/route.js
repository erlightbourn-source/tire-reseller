import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const OFFER_TTL_MS = 48 * 60 * 60 * 1000; // offers expire after 48h

// Accept, decline, or counter an offer message. Only the recipient acts.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { messageId, action, offerCents } = await req.json();
  if (!["accept", "decline", "counter"].includes(action))
    return NextResponse.json({ error: "Bad action." }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: messageId }, include: { thread: true } });
  if (!msg || msg.kind !== "offer") return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  const t = msg.thread;
  if (t.buyerId !== user.id && t.sellerId !== user.id)
    return NextResponse.json({ error: "Not your thread." }, { status: 403 });
  if (msg.senderId === user.id)
    return NextResponse.json({ error: "You can't respond to your own offer." }, { status: 400 });
  if (msg.offerStatus !== "pending")
    return NextResponse.json({ error: "This offer was already answered." }, { status: 409 });
  if (Date.now() - new Date(msg.createdAt).getTime() > OFFER_TTL_MS) {
    await prisma.message.update({ where: { id: msg.id }, data: { offerStatus: "expired" } });
    return NextResponse.json({ error: "This offer has expired." }, { status: 409 });
  }

  if (action === "counter") {
    const cents = Math.round(Number(offerCents));
    if (!cents || cents <= 0) return NextResponse.json({ error: "Enter a counter amount." }, { status: 400 });
    await prisma.message.update({ where: { id: msg.id }, data: { offerStatus: "countered" } });
    await prisma.message.create({
      data: {
        threadId: t.id,
        senderId: user.id,
        kind: "offer",
        offerCents: cents,
        offerStatus: "pending",
        body: `Counter-offer: $${(cents / 100).toLocaleString()}`,
      },
    });
    await prisma.thread.update({ where: { id: t.id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const accepted = action === "accept";
  await prisma.message.update({
    where: { id: msg.id },
    data: { offerStatus: accepted ? "accepted" : "declined" },
  });
  await prisma.message.create({
    data: {
      threadId: t.id,
      senderId: user.id,
      body: accepted
        ? `✅ Accepted your offer of $${(msg.offerCents / 100).toLocaleString()}. Let's arrange pickup!`
        : `Declined the offer of $${(msg.offerCents / 100).toLocaleString()}.`,
    },
  });
  if (accepted) {
    await prisma.listing.update({ where: { id: t.listingId }, data: { status: "sold" } }).catch(() => {});
  }
  await prisma.thread.update({ where: { id: t.id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
