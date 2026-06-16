import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";

// Upgrade to / cancel Pro. In production, Pro is unlocked ONLY for users with a
// verified active Stripe subscription (set by the signed webhook) — never granted
// for free here. In dev (NODE_ENV !== "production") we simulate the upgrade so the
// gated flow is testable without a Stripe account.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!canSell(user)) return NextResponse.json({ error: "Become a seller first.", code: "become_seller" }, { status: 402 });
  if (process.env.NODE_ENV === "production" && user.subscriptionStatus !== "active") {
    return NextResponse.json(
      { error: "Subscribe to unlock Pro.", code: "use_checkout" },
      { status: 402 }
    );
  }
  await prisma.user.update({ where: { id: user.id }, data: { pro: true } });
  // Mirror onto the seller's listings for ranked placement (DB-side ordering).
  await prisma.listing.updateMany({ where: { sellerId: user.id }, data: { sellerPro: true } });
  return NextResponse.json({ ok: true, pro: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { pro: false } });
  await prisma.listing.updateMany({ where: { sellerId: user.id }, data: { sellerPro: false } });
  return NextResponse.json({ ok: true, pro: false });
}
