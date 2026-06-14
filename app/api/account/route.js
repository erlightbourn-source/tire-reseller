import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroySession, verifyPassword, hashPassword, revokeSessions, createSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";

// PATCH: change password or "log out everywhere" — both bump the user's
// tokenVersion (revoking other sessions) and re-issue a fresh cookie here.
export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const limited = await enforceRateLimit(req, `acct:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const { action, current, next } = await req.json();

  if (action === "logout-all") {
    const tv = await revokeSessions(user.id);
    await createSession(user.id, tv);
    return NextResponse.json({ ok: true });
  }

  if (action === "password") {
    if (typeof next !== "string" || next.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
    if (next.length > 200) return NextResponse.json({ error: "Password is too long." }, { status: 400 });
    if (!(await verifyPassword(String(current || ""), user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next), tokenVersion: { increment: 1 } },
    });
    const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { tokenVersion: true } });
    await createSession(user.id, fresh.tokenVersion);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

// GET: export everything we hold about the signed-in user as a JSON download.
export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const limited = await enforceRateLimit(req, `export:${user.id}`, { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const [listings, favorites, savedSearches, reviewsWritten, reviewsReceived, threads] = await Promise.all([
    prisma.listing.findMany({ where: { sellerId: user.id }, include: { photos: true } }),
    prisma.favorite.findMany({ where: { userId: user.id }, select: { listingId: true, createdAt: true } }),
    prisma.savedSearch.findMany({ where: { userId: user.id } }),
    prisma.review.findMany({ where: { authorId: user.id } }),
    prisma.review.findMany({ where: { sellerId: user.id } }),
    prisma.thread.findMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      include: { messages: { where: { senderId: user.id }, select: { body: true, kind: true, offerCents: true, createdAt: true } } },
    }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      location: user.location,
      state: user.state,
      role: user.role,
      pro: user.pro,
      createdAt: user.createdAt,
      subscriptionStatus: user.subscriptionStatus,
    },
    listings,
    favorites,
    savedSearches,
    reviewsWritten,
    reviewsReceived,
    // Only the messages this user sent, grouped by thread.
    sentMessages: threads.flatMap((t) => t.messages.map((m) => ({ threadId: t.id, ...m }))),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tiretrader-data-${user.id.slice(0, 8)}.json"`,
    },
  });
}

// DELETE: permanently remove the account. Cascades to listings, threads,
// messages, favorites, saved searches, reviews, reports, blocks (schema FKs).
export async function DELETE(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const limited = await enforceRateLimit(req, `del:${user.id}`, { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  await prisma.user.delete({ where: { id: user.id } });
  destroySession();
  return NextResponse.json({ ok: true });
}
