import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Accept or decline an offer message. Only the recipient (not the sender) acts.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { messageId, action } = await req.json();
  if (!["accept", "decline"].includes(action))
    return NextResponse.json({ error: "Bad action." }, { status: 400 });

  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    include: { thread: true },
  });
  if (!msg || msg.kind !== "offer") return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  const t = msg.thread;
  if (t.buyerId !== user.id && t.sellerId !== user.id)
    return NextResponse.json({ error: "Not your thread." }, { status: 403 });
  if (msg.senderId === user.id)
    return NextResponse.json({ error: "You can't respond to your own offer." }, { status: 400 });
  if (msg.offerStatus !== "pending")
    return NextResponse.json({ error: "This offer was already answered." }, { status: 409 });

  const accepted = action === "accept";
  await prisma.message.update({
    where: { id: msg.id },
    data: { offerStatus: accepted ? "accepted" : "declined" },
  });

  // System reply in the thread
  await prisma.message.create({
    data: {
      threadId: t.id,
      senderId: user.id,
      body: accepted
        ? `✅ Accepted your offer of $${(msg.offerCents / 100).toLocaleString()}. Let's arrange pickup!`
        : `Declined the offer of $${(msg.offerCents / 100).toLocaleString()}.`,
    },
  });

  // On accept, mark the listing sold
  if (accepted) {
    await prisma.listing.update({ where: { id: t.listingId }, data: { status: "sold" } }).catch(() => {});
  }
  await prisma.thread.update({ where: { id: t.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
