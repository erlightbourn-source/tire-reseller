// Parse a tire-size string into numeric components so we can filter/sort on
// indexed integer columns instead of `LIKE '%...%'` scans. Pure + testable.
//
//   "245/40R19"    -> { width: 245, aspect: 40, rim: 19 }
//   "P245/40ZR19"  -> { width: 245, aspect: 40, rim: 19 }
//   "LT265/70R17"  -> { width: 265, aspect: 70, rim: 17 }
//   "R19" / "19"   -> { width: null, aspect: null, rim: 19 }
//   "245"          -> { width: 245, aspect: null, rim: null }
//   "bald goodyear"-> { width: null, aspect: null, rim: null }
import { parseTread, perTire } from "./tire.js";

export function parseTireSize(input) {
  const s = String(input || "").toUpperCase().replace(/\s+/g, "");
  const empty = { width: null, aspect: null, rim: null };
  if (!s) return empty;
  // Full metric size: 3-digit width, "/", 2-digit aspect, optional letters, 2-digit rim.
  const full = s.match(/(\d{3})\/(\d{2})\D*(\d{2})/);
  if (full) return { width: Number(full[1]), aspect: Number(full[2]), rim: Number(full[3]) };
  // Rim only: "R17" or a bare 2-digit in the wheel-diameter range.
  const rimMatch = s.match(/R(\d{2})\b/) || s.match(/^(\d{2})$/);
  if (rimMatch) {
    const rim = Number(rimMatch[1]);
    if (rim >= 8 && rim <= 30) return { width: null, aspect: null, rim };
  }
  // Width only.
  const widthMatch = s.match(/^(\d{3})$/);
  if (widthMatch) return { width: Number(widthMatch[1]), aspect: null, rim: null };
  return empty;
}

/** Denormalized columns derived from a listing's size string. */
export function deriveSizeColumns(size) {
  const { width, aspect, rim } = parseTireSize(size);
  return { widthMm: width, aspectRatio: aspect, rimDiameter: rim };
}

/** All denormalized scalar columns for a listing (size + tread + per-tire price). */
export function deriveListingColumns({ size, treadDepth, priceCents, quantity }) {
  return {
    ...deriveSizeColumns(size),
    treadDepth32: treadDepth != null && treadDepth !== "" ? (parseTread(treadDepth)?.n ?? null) : null,
    perTireCents: Number.isFinite(priceCents) ? perTire(priceCents, quantity) : null,
  };
}

/**
 * Translate a user-entered size filter into an indexed Prisma `where` fragment.
 * Returns structured-column equality clauses when the input parses (the common
 * case: exact sizes from vehicle search, or "R19" rim searches), else falls back
 * to a substring match for free-text that doesn't look like a size.
 */
export function sizeWhere(sizeInput) {
  const { width, aspect, rim } = parseTireSize(sizeInput);
  if (width == null && aspect == null && rim == null) {
    return { size: { contains: String(sizeInput) } }; // non-size text → fallback
  }
  const clause = {};
  if (width != null) clause.widthMm = width;
  if (aspect != null) clause.aspectRatio = aspect;
  if (rim != null) clause.rimDiameter = rim;
  return clause;
}
