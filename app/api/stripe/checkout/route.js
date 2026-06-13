import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  if (user.subscriptionStatus === "active") {
    return NextResponse.json({ url: "/dashboard" });
  }

  // ── DEV MODE ──────────────────────────────────────────────────────────────
  // No real Stripe keys configured: simulate a successful subscription so the
  // whole gated flow is testable without a Stripe account.
  if (!stripeConfigured()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "active",
        subscriptionPriceId: "dev_simulated",
        subscriptionCurrentEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ url: "/dashboard?welcome=dev", simulated: true });
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
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/subscribe?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
