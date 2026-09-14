// Compare a listing's per-tire price against comparable listings of the same
// size to give buyers a "fair price" signal. Pure + testable. Needs at least a
// few comps to say anything; returns null otherwise.

const MIN_COMPS = 3;

/**
 * @param {number} perTireCents   this listing's price per tire (in cents)
 * @param {number[]} compsPerTire other same-size listings' price per tire (cents)
 * @returns {{ avg:number, deltaPct:number, tone:'good'|'fair'|'high', label:string, count:number }|null}
 */
export function priceContext(perTireCents, compsPerTire) {
  const comps = (compsPerTire || []).filter((n) => Number.isFinite(n) && n > 0);
  if (comps.length < MIN_COMPS || !Number.isFinite(perTireCents) || perTireCents <= 0) return null;

  const avg = Math.round(comps.reduce((s, n) => s + n, 0) / comps.length);
  const deltaPct = Math.round(((perTireCents - avg) / avg) * 100);

  let tone, label;
  if (deltaPct <= -10) { tone = "good"; label = `${Math.abs(deltaPct)}% below the typical price`; }
  else if (deltaPct >= 15) { tone = "high"; label = `${deltaPct}% above the typical price`; }
  else { tone = "fair"; label = "around the typical price"; }

  return { avg, deltaPct, tone, label, count: comps.length };
}

/**
 * Same signal as priceContext, but from a precomputed cohort average + count
 * (e.g. a SQL groupBy) instead of the raw comps array. `count` is the TOTAL
 * cohort size including this listing; we require >= MIN_COMPS others.
 */
export function priceContextFromStats(perTireCents, avgCents, count) {
  if (!Number.isFinite(perTireCents) || perTireCents <= 0) return null;
  if (!Number.isFinite(avgCents) || avgCents <= 0) return null;
  if (!Number.isFinite(count) || count - 1 < MIN_COMPS) return null;

  const avg = Math.round(avgCents);
  const deltaPct = Math.round(((perTireCents - avg) / avg) * 100);

  let tone, label;
  if (deltaPct <= -10) { tone = "good"; label = `${Math.abs(deltaPct)}% below the typical price`; }
  else if (deltaPct >= 15) { tone = "high"; label = `${deltaPct}% above the typical price`; }
  else { tone = "fair"; label = "around the typical price"; }

  return { avg, deltaPct, tone, label, count: count - 1 };
}

// ─────────────────────────────────────────────────────────────────────────────
// SELLER PLAN PRICING — the single source of truth (owner decision 2026-09-06).
//
// TireTrader has ONE seller plan. Listing is free during launch (no card; the
// per-account window is `User.sellerFreeUntil`). Once billing starts, the first
// FOUNDING_SEATS sellers flagged `User.foundingSeller` pay FOUNDING_MONTHLY for
// life; everyone after pays STANDARD_MONTHLY. Priority placement, the verified
// badge and bulk listing are INCLUDED in the plan — there is no separate "Pro"
// upgrade and no "first year free, then $10" tier.
//
// No page may hardcode a dollar figure: import from here.
// ─────────────────────────────────────────────────────────────────────────────

export const FOUNDING_SEATS = 25;
export const FOUNDING_MONTHLY = 10;
export const STANDARD_MONTHLY = 25;
export const PLAN_NAME = "TireTrader Seller";

/** "$10/month" style label. */
export const fmtMonthly = (usd) => `$${usd}/month`;
/** "$10/mo" style short label for tight UI. */
export const fmtMonthlyShort = (usd) => `$${usd}/mo`;

export const FOUNDING_LABEL = fmtMonthly(FOUNDING_MONTHLY);
export const STANDARD_LABEL = fmtMonthly(STANDARD_MONTHLY);
export const FOUNDING_SHORT = fmtMonthlyShort(FOUNDING_MONTHLY);
export const STANDARD_SHORT = fmtMonthlyShort(STANDARD_MONTHLY);

export const TIERS = {
  founding: {
    tier: "founding",
    monthly: FOUNDING_MONTHLY,
    label: FOUNDING_LABEL,
    short: FOUNDING_SHORT,
    locked: true,
    name: "Founding Seller",
  },
  standard: {
    tier: "standard",
    monthly: STANDARD_MONTHLY,
    label: STANDARD_LABEL,
    short: STANDARD_SHORT,
    locked: false,
    name: "Seller",
  },
};

/**
 * Which price a user pays once billing applies. Founding status is the ONLY
 * input: it is an admin-granted flag (`/api/admin`), never inferred from the
 * seat count, so a founder keeps their price after the program closes.
 * @param {{ foundingSeller?: boolean }|null|undefined} user
 * @returns {{ tier:'founding'|'standard', monthly:number, label:string, short:string, locked:boolean, name:string }}
 */
export function priceFor(user) {
  return user && user.foundingSeller ? TIERS.founding : TIERS.standard;
}

/** True for a real-looking Stripe price id (not the .env.example placeholder). */
export function isPriceId(id) {
  return typeof id === "string" && id.startsWith("price_") && !id.includes("REPLACE_ME");
}

/**
 * Stripe price id for a tier. Tier-specific env vars win; the legacy
 * STRIPE_PRICE_ID is the fallback so production keeps working until the owner
 * adds the two ids in Vercel. Returns null when nothing usable is set.
 * Pure (env injectable) so it is testable without the Stripe SDK.
 */
export function resolvePriceId(tier, env = process.env) {
  const specific = tier === "founding" ? env.STRIPE_PRICE_FOUNDING : env.STRIPE_PRICE_STANDARD;
  if (isPriceId(specific)) return specific;
  if (isPriceId(env.STRIPE_PRICE_ID)) return env.STRIPE_PRICE_ID;
  return null;
}

/**
 * Describe the Stripe price configuration so callers can warn (never throw):
 *   "tiered"  — both tier ids set (legacy id irrelevant)
 *   "legacy"  — only STRIPE_PRICE_ID set → BOTH tiers bill at that one price
 *   "partial" — one tier id set, no legacy fallback for the other
 *   "mixed"   — one tier id set AND a legacy STRIPE_PRICE_ID (the other tier silently bills at the legacy price)
 *   "none"    — nothing usable
 */
export function priceConfigState(env = process.env) {
  const f = isPriceId(env.STRIPE_PRICE_FOUNDING);
  const s = isPriceId(env.STRIPE_PRICE_STANDARD);
  const legacy = isPriceId(env.STRIPE_PRICE_ID);
  if (f && s) return "tiered";
  if (!f && !s) return legacy ? "legacy" : "none";
  return legacy ? "mixed" : "partial";
}

/** "7 of 25 founding spots claimed" — or null when the count is unknown. */
export function foundingSpotsLine(claimed) {
  if (!Number.isInteger(claimed) || claimed < 0) return null;
  const n = Math.min(claimed, FOUNDING_SEATS);
  return `${n} of ${FOUNDING_SEATS} founding spots claimed`;
}

/** One-sentence copy snippets shared by pages. Every dollar figure derives from the constants above. */
export const PLAN_COPY = {
  buyersFree: "Buyers always browse free.",
  launchFree: "Free to list during launch — no card required.",
  foundingStory: `The first ${FOUNDING_SEATS} Founding Sellers lock in ${FOUNDING_LABEL} for life; every seller after pays ${STANDARD_LABEL}.`,
  foundingBanner: `Founding sellers: first ${FOUNDING_SEATS} lock ${FOUNDING_SHORT} for life`,
  foundingLock: `${FOUNDING_LABEL}, locked for life`,
  standardAfterLaunch: `${STANDARD_LABEL} after launch · cancel anytime`,
  perksIncluded: "Priority placement, the verified badge, and bulk listing are all included in the seller plan — there is no separate upgrade.",
  cancelAnytime: "No contracts. Cancel anytime.",
  tiersShort: `founders ${FOUNDING_SHORT} · standard ${STANDARD_SHORT}`,
  siteTagline: `The marketplace built for tire resellers. Browse free; list free during launch, then one simple seller plan from ${FOUNDING_LABEL}.`,
};
