import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { priceFor, resolvePriceId } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

// Stripe needs absolute success/cancel URLs. Prefer APP_URL, then the public
// site URL — never a localhost default in production.
const APP_URL = (process.env.APP_URL || SITE_URL).replace(/\/$/, "");

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  if (user.subscriptionStatus === "active") {
    return NextResponse.json({ url: "/dashboard" });
  }

  // ONE seller plan, two prices: founders lock the founding price, everyone
  // else pays standard (lib/pricing.js). The plan includes the perks (`pro`).
  const { tier } = priceFor(user);

  // ── DEV MODE ──────────────────────────────────────────────────────────────
  // No real Stripe keys configured: simulate a successful subscription so the
  // whole gated flow is testable without a Stripe account.
  if (!stripeConfigured()) {
    if (process.env.NODE_ENV === "production") {
      // Never grant a free active plan in production because of a missing/typo'd env var.
      return NextResponse.json({ error: "Billing is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "active",
        subscriptionPriceId: `dev_simulated_${tier}`,
        subscriptionCurrentEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        pro: true,
      },
    });
    await prisma.listing.updateMany({ where: { sellerId: user.id }, data: { sellerPro: true } });
    return NextResponse.json({ url: "/dashboard?welcome=dev", simulated: true, tier });
  }

  // ── REAL STRIPE (TEST MODE) ────────────────────────────────────────────────
  const stripe = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: resolvePriceId(tier), quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, tier },
    success_url: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/subscribe?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
