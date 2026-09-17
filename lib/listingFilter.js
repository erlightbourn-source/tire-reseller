import { isStateAbbr } from "./states.js";
import { sizeWhere } from "./tiresize.js";

// Case-insensitive text search. Postgres `LIKE` (Prisma `contains`) is case-SENSITIVE,
// so real lowercase queries returned 0 results in prod. `mode:"insensitive"` fixes it —
// but it's Postgres-only and THROWS on SQLite (the local/dev provider, auto-swapped by
// scripts/db-provider.mjs), where `contains` is already case-insensitive. So gate it on
// the runtime DATABASE_URL scheme: add mode for postgres, omit for sqlite. Exported so
// the browse page's own q-clause stays consistent with this one.
export const CI = (process.env.DATABASE_URL || "").startsWith("postgres")
  ? { mode: "insensitive" }
  : {};

// Build a Prisma `where.AND` array from a plain params object (the browse
// filters). Shared by the browse page and saved-search match counting.
// Note: radius/geo filtering is applied separately in JS, not here.
export function buildListingWhere(p = {}) {
  const AND = [{ status: "active" }];
  if (p.state && isStateAbbr(p.state)) AND.push({ state: String(p.state).toUpperCase() });
  if (p.brand) AND.push({ brand: p.brand });
  if (p.condition) AND.push({ condition: p.condition });
  // Size → indexed structured columns (widthMm/aspectRatio/rimDiameter) when the
  // input parses, else a substring fallback. Avoids `LIKE '%...%'` table scans.
  if (p.size) AND.push(sizeWhere(p.size));
  if (p.season) AND.push({ season: p.season });
  if (p.runFlat === "1" || p.runFlat === true) AND.push({ runFlat: true });
  // Coerce + validate numerics: a NaN (e.g. ?maxPrice=abc) would otherwise build
  // a `{ lte: NaN }` clause that errors or matches nothing.
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const maxPrice = num(p.maxPrice);
  if (maxPrice != null && maxPrice >= 0) AND.push({ priceCents: { lte: Math.round(maxPrice * 100) } });
  const minYear = num(p.minYear);
  if (minYear != null) AND.push({ dotYear: { gte: minYear } });
  const qty = num(p.qty);
  if (qty != null) AND.push({ quantity: { gte: qty } });
  // Tread + seller-rating filters are now DB clauses (indexed/denormalized
  // columns) rather than post-fetch JS passes.
  const minTread = num(p.minTread);
  if (minTread != null) AND.push({ treadDepth32: { gte: minTread } });
  const minRating = num(p.minRating);
  if (minRating != null) AND.push({ seller: { ratingAvg: { gte: minRating } } });
  if (p.shipping === "1" || p.shipping === true) AND.push({ shipping: true });
  if (p.q) {
    const q = String(p.q).slice(0, 120); // cap (cron passes stored query strings)
    AND.push({
      OR: [
        { brand: { contains: q, ...CI } },
        { size: { contains: q, ...CI } },
        { location: { contains: q, ...CI } },
        { description: { contains: q, ...CI } },
      ],
    });
  }
  return AND;
}

// Human label for a saved search, e.g. "Winter · 225/45R17 · Texas".
// Labels are reflected into alert-email subjects/bodies, so every user-controlled
// value is stripped of control chars (no CRLF/tab) and length-capped to prevent
// content injection into the branded mail.
export function describeSearch(p = {}, stateName) {
  const c = (v) => String(v).replace(/[\r\n\t]+/g, " ").trim().slice(0, 48);
  const parts = [];
  if (p.q) parts.push(`"${c(p.q)}"`);
  if (p.brand) parts.push(c(p.brand));
  if (p.size) parts.push(c(p.size));
  if (p.season) parts.push(c(p.season));
  if (p.condition) parts.push(p.condition === "new" ? "New" : "Used");
  if (p.runFlat === "1") parts.push("Run-flat");
  if (p.minYear) parts.push(`${c(p.minYear)}+ DOT`);
  if (p.qty) parts.push(`${c(p.qty)}+ tires`);
  if (p.shipping === "1") parts.push("Ships");
  if (p.minRating) parts.push(`★ ${c(p.minRating)}+`);
  if (p.maxPrice) parts.push(`under $${c(p.maxPrice)}`);
  if (p.state && stateName) parts.push(stateName(p.state));
  return parts.length ? parts.join(" · ") : "All tires";
}
