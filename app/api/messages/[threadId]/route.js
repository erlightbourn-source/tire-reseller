import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit, cleanStr, ValidationError, LIMITS } from "@/lib/security";

async function loadThread(threadId, userId) {
  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return { code: 404 };
  if (thread.buyerId !== userId && thread.sellerId !== userId) return { code: 403 };
  return { thread };
}

// Poll endpoint: returns all messages in a thread (and marks others' as read).
export async function GET(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { thread, code } = await loadThread(params.threadId, user.id);
  if (code) return NextResponse.json({ error: "Not found." }, { status: code });

  await prisma.message.updateMany({
    where: { threadId: thread.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    isSeller: thread.sellerId === user.id,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === user.id,
      kind: m.kind,
      offerCents: m.offerCents,
      offerStatus: m.offerStatus,
      createdAt: m.createdAt,
    })),
  });
}

// Send a message — text or an offer (kind:"offer", offerCents).
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  // Throttle message spam.
  const limited = await enforceRateLimit(req, `msg:${user.id}`, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { thread, code } = await loadThread(params.threadId, user.id);
  if (code) return NextResponse.json({ error: "Not found." }, { status: code });

  const { body, kind, offerCents } = await req.json();

  if (kind === "offer") {
    const cents = Math.round(Number(offerCents));
    if (!cents || cents <= 0 || cents > 100_000_000)
      return NextResponse.json({ error: "Enter a valid offer amount." }, { status: 400 });
    let note;
    try { note = cleanStr(body, LIMITS.message, { field: "Message" }); }
    catch (e) { if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 }); throw e; }
    const msg = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        kind: "offer",
        offerCents: cents,
        offerStatus: "pending",
        body: note || `Offer: $${(cents / 100).toLocaleString()}`,
      },
    });
    await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ ok: true, id: msg.id });
  }

  let text;
  try { text = cleanStr(body, LIMITS.message, { required: true, field: "Message" }); }
  catch (e) { if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 }); throw e; }
  const msg = await prisma.message.create({
    data: { threadId: thread.id, senderId: user.id, body: text },
  });
  await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true, id: msg.id });
}
