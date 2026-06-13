import Stripe from "stripe";

/**
 * Stripe is OPTIONAL for local development. The app runs in a simulated
 * "dev mode" until real test keys are pasted into .env. This helper centralizes
 * that check so the rest of the app can ask: are we using real Stripe?
 */

export function stripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const price = process.env.STRIPE_PRICE_ID || "";
  return (
    key.startsWith("sk_") &&
    !key.includes("REPLACE_ME") &&
    price.startsWith("price_") &&
    !price.includes("REPLACE_ME")
  );
}

let _stripe = null;
export function getStripe() {
  if (!stripeConfigured()) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });
  }
  return _stripe;
}
