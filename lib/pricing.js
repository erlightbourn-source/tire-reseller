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
