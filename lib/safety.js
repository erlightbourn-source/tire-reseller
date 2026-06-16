// Heuristics that flag attempts to move a deal off-platform — the top fraud
// vector on local marketplaces (scammers push to text/WhatsApp + Zelle/wire and
// "pay before you see it"). Pure + testable; used to surface buyer warnings.

const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
// Bounded on both local-part and domain so a long no-`@` run can't trigger
// catastrophic backtracking (the unbounded `[^\s@]+@[^\s@]+` version was ReDoS:
// ~70ms at 4k chars, growing quadratically). This form is linear (<1ms at 16k).
const EMAIL_RE = /(^|[\s(])[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,24}/i;
const PAYMENT_RE = /\b(venmo|zelle|cash ?app|paypal|wire transfer|western union|money ?gram|bitcoin|btc|crypto|gift ?card)\b/i;
const CONTACT_RE = /\b(whats ?app|telegram|signal|kik|snapchat|text me|call me|my number|reach me at)\b/i;

/** Returns { flagged, reasons } for a piece of user text. */
export function detectOffPlatform(text) {
  // Cap length defensively (callers vary); bounds the per-call regex cost.
  const s = String(text || "").slice(0, 4000);
  const reasons = [];
  if (PHONE_RE.test(s)) reasons.push("phone");
  if (EMAIL_RE.test(s)) reasons.push("email");
  if (PAYMENT_RE.test(s)) reasons.push("payment");
  if (CONTACT_RE.test(s)) reasons.push("contact");
  return { flagged: reasons.length > 0, reasons };
}

export const SAFETY_WARNING =
  "Keep messages and payment on TireTrader. Be cautious of anyone asking you to text/email, pay by Zelle/Venmo/wire/gift card, or pay before inspecting the tires in person.";
