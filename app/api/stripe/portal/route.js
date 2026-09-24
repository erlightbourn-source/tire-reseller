import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { enforceRateLimit } from "@/lib/security";

// Self-serve billing: sends a seller to Stripe's hosted customer portal, where they can
// cancel (at period end), update their card, and see invoices. Cancellation there fires
// customer.subscription.updated / .deleted, which the existing webhook already handles.
const APP_URL = (process.env.APP_URL || SITE_URL).replace(/\/$/, "");

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const limited = await enforceRateLimit(req, "stripe-portal", { key: user.id, limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  if (!stripeConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Billing is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    // Dev mode has no real Stripe customer to manage.
    return NextResponse.json({ url: "/dashboard?portal=dev", simulated: true });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "There's no billing account on file yet." }, { status: 400 });
  }

  try {
    const params = { customer: user.stripeCustomerId, return_url: `${APP_URL}/dashboard` };
    // Portal settings (cancel at period end, card update, invoices) live in a Stripe
    // configuration; pin it explicitly so we never depend on the account's default one.
    if (process.env.STRIPE_PORTAL_CONFIGURATION) params.configuration = process.env.STRIPE_PORTAL_CONFIGURATION;
    const session = await getStripe().billingPortal.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe] billing portal session failed:", err.message);
    return NextResponse.json(
      { error: "Couldn't open billing right now. Please try again, or contact us to cancel." },
      { status: 502 }
    );
  }
}
