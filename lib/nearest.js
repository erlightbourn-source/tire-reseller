import { milesBetween } from "./geo.js";

// TireKind is a South Florida marketplace (Evan 2026-09-29): when we can't locate the
// visitor, rank from Broward (Fort Lauderdale, the county seat).
export const BROWARD = { lat: 26.1224, lng: -80.1373 };

// Distance bands (miles). Local always beats far away, and inside a band the paid
// "priority placement" (featured, then seller plan) still leads, then the nearer set.
export const BANDS = [25, 75, 200];
const band = (d) => { const i = BANDS.findIndex((m) => d <= m); return i === -1 ? (Number.isFinite(d) ? BANDS.length : BANDS.length + 1) : i; };

// Nearest-first ranking for the homepage "Recently listed" strip. `pool` arrives newest
// first, and the sort is stable, so recency breaks any remaining tie. Listings without
// coordinates sink to the end.
export function nearestFirst(pool, origin, limit = 4) {
  const lat = Number(origin?.lat), lng = Number(origin?.lng);
  const from = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : BROWARD;
  return pool
    .map((l) => { const d = milesBetween(from.lat, from.lng, l.lat, l.lng); return { l, d, b: band(d) }; })
    .sort((a, b) => (a.b - b.b) || ((b.l.featured ? 1 : 0) - (a.l.featured ? 1 : 0)) ||
      ((b.l.sellerPro ? 1 : 0) - (a.l.sellerPro ? 1 : 0)) || (a.d - b.d))
    .slice(0, limit)
    .map((x) => x.l);
}
