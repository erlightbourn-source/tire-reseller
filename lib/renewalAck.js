// Post-purchase auto-renewal acknowledgment (CA BPC 17602(a)(3): after the
// purchase, send the renewal terms, the cancellation policy and how to cancel
// in a form the customer can keep). Sent once per Checkout Session from the
// Stripe webhook. Pure so it can be unit-tested; no server-only imports.
// Wording: Ada recheckJ draft 2026-09-26, plan name aligned to PLAN_NAME.
import { PLAN_NAME } from "./pricing.js";

/** "$10.00" from Stripe minor units. Non-USD falls back to "12.00 EUR". */
export function fmtAmount(unitAmount, currency = "usd") {
  const n = (Number(unitAmount) || 0) / 100;
  const cur = String(currency || "usd").toLowerCase();
  return cur === "usd" ? `$${n.toFixed(2)}` : `${n.toFixed(2)} ${cur.toUpperCase()}`;
}

function fmtDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * @param {{ unitAmount:number, currency?:string, interval?:string, trialEnd?:number|null, siteUrl:string }} p
 * @returns {{ subject:string, text:string }}
 */
export function renewalAckEmail({ unitAmount, currency = "usd", interval = "month", trialEnd = null, siteUrl }) {
  const price = `${fmtAmount(unitAmount, currency)}/${interval}`;
  const every = interval === "year" ? "every year" : `every ${interval}`;
  const base = String(siteUrl || "").replace(/\/$/, "");
  const lines = [
    `Thanks for subscribing to the ${PLAN_NAME} plan.`,
    "",
    `What you signed up for: the ${PLAN_NAME} plan at ${price}, charged to the card you entered. It renews automatically ${every} until you cancel.`,
  ];
  if (trialEnd) {
    const d = fmtDate(trialEnd);
    lines.push(`Your free period ends ${d}. Your first charge of ${fmtAmount(unitAmount, currency)} is on ${d} unless you cancel before then.`);
  }
  lines.push(
    "",
    `How to cancel: go to ${base}/dashboard and choose "Manage or cancel plan", or reply to this email, or write to hello@tirekind.com. Cancelling stops future charges; you keep the plan until the end of the period you already paid for. Refunds and price changes: ${base}/terms.`,
    "",
    "TireKind is operated by E.V. Tech Solutions LLC, a Florida limited liability company.",
  );
  return { subject: `Your ${PLAN_NAME} subscription is active`, text: lines.join("\n") };
}
