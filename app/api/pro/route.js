import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";

// Activate / deactivate the seller-plan perks flag (`pro`). There is ONE plan:
// the Stripe webhook + success page already set `pro` on activation, so in
// production this is only a self-serve repair for an active subscriber whose
// flag is off (e.g. accounts activated before perks were bundled). Never granted
// without a verified active subscription. In dev (NODE_ENV !== "production") the
// activation is simulated so the gated flow is testable without Stripe.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!canSell(user)) return NextResponse.json({ error: "Become a seller first.", code: "become_seller" }, { status: 402 });
  if (process.env.NODE_ENV === "production" && user.subscriptionStatus !== "active") {
    return NextResponse.json(
      { error: "Subscribe to the seller plan to unlock these perks.", code: "use_checkout" },
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
  // Founding sellers keep ranked placement after the perks flag is cleared —
  // revert to their founding flag, not a hard false.
  await prisma.listing.updateMany({ where: { sellerId: user.id }, data: { sellerPro: !!user.foundingSeller } });
  return NextResponse.json({ ok: true, pro: false });
}
