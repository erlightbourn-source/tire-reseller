import Stripe from "stripe";
import { resolvePriceId, priceConfigState } from "@/lib/pricing";

/**
 * Stripe is OPTIONAL for local development. The app runs in a simulated
 * "dev mode" until real test keys are pasted into .env. This helper centralizes
 * that check so the rest of the app can ask: are we using real Stripe?
 *
 * Prices: one recurring price per tier — STRIPE_PRICE_FOUNDING (the founding
 * price, locked for founders) and STRIPE_PRICE_STANDARD. The legacy
 * STRIPE_PRICE_ID still works as a fallback for either tier (lib/pricing.js
 * resolvePriceId; the dollar amounts live there too).
 */

function keyConfigured() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return key.startsWith("sk_") && !key.includes("REPLACE_ME");
}

// Lightweight, non-fatal, once-per-process pricing config warning. Only fires
// when the secret key is real (a placeholder .env is expected to be incomplete).
let _warned = false;
function warnPricingConfig() {
  if (_warned || !keyConfigured()) return;
  _warned = true;
  const state = priceConfigState();
  if (state === "legacy") {
    console.warn(
      "[stripe] Only STRIPE_PRICE_ID is set — founding and standard sellers will BOTH be billed at that one price. " +
        "Set STRIPE_PRICE_FOUNDING and STRIPE_PRICE_STANDARD (see GO-LIVE.md)."
    );
  } else if (state === "mixed") {
    console.warn(
      "[stripe] Only one of STRIPE_PRICE_FOUNDING / STRIPE_PRICE_STANDARD is set; the other tier is billing at the legacy STRIPE_PRICE_ID price. " +
        "Set both tier ids (see GO-LIVE.md)."
    );
  } else if (state === "partial") {
    console.warn(
      "[stripe] Only one of STRIPE_PRICE_FOUNDING / STRIPE_PRICE_STANDARD is set and there is no STRIPE_PRICE_ID fallback — " +
        "checkout for the other tier will run in simulated dev mode."
    );
  }
}

export function stripeConfigured() {
  warnPricingConfig();
  return keyConfigured() && !!resolvePriceId("founding") && !!resolvePriceId("standard");
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
