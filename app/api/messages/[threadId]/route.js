import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === user.id,
      createdAt: m.createdAt,
    })),
  });
}

// Send a message.
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { thread, code } = await loadThread(params.threadId, user.id);
  if (code) return NextResponse.json({ error: "Not found." }, { status: code });

  const { body } = await req.json();
  if (!body || !body.trim()) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  const msg = await prisma.message.create({
    data: { threadId: thread.id, senderId: user.id, body: body.trim() },
  });
  await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ ok: true, id: msg.id });
}
