// Proof fields on a listing: tread depth, DOT year, load index / speed rating.
// Pure + dependency-free (no next/server) so the rules are unit-testable and the
// create route, the edit route and the listing page all share one definition.
import { ValidationError, cleanStr, LIMITS } from "./validation.js";

// Tire speed-symbol letters (L = 75 mph ... Z = 150+ mph), plus the "ZR" marking and
// the parenthesised forms printed on the sidewall of very-high-speed tires.
export const SPEED_RATINGS = ["L", "M", "N", "P", "Q", "R", "S", "T", "U", "H", "V", "W", "Y", "Z", "ZR", "(Y)", "(W)", "(ZR)"];
const SPEED_SET = new Set(SPEED_RATINGS);

export const DOT_YEAR_MIN = 1990;

/** True only for a canonical (already uppercase) rating from the valid set. */
export function isValidSpeedRating(v) {
  return typeof v === "string" && SPEED_SET.has(v);
}

/**
 * Normalise a seller-entered speed rating. Empty -> null (the field is optional);
 * anything outside the valid set throws, e.g. the mph mix-up "130" for "H".
 */
export function normalizeSpeedRating(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  if (!s) return null;
  if (!SPEED_SET.has(s)) {
    throw new ValidationError(
      "Speed rating must be the letter printed after the load index on the sidewall (for example H, V, W, Y or ZR), not a number like 130 mph."
    );
  }
  return s;
}

/**
 * DOT manufacture year as an integer in DOT_YEAR_MIN..(current year + 1).
 * required: a missing value throws. Optional (edit path): empty -> null, but a
 * provided value is always validated.
 */
export function parseDotYear(raw, { required = false, now = new Date() } = {}) {
  const max = now.getFullYear() + 1;
  const empty = raw == null || (typeof raw === "string" && raw.trim() === "");
  if (empty) {
    if (required) throw new ValidationError("DOT year is required. Find the 4 digits after \"DOT\" on the sidewall: the last two are the year (2321 = 2021).");
    return null;
  }
  const text = typeof raw === "string" ? raw.trim() : raw;
  const n = typeof text === "number" ? text : /^\d{4}$/.test(text) ? Number(text) : NaN;
  if (!Number.isInteger(n) || n < DOT_YEAR_MIN || n > max) {
    throw new ValidationError(`DOT year must be a 4-digit year between ${DOT_YEAR_MIN} and ${max}.`);
  }
  return n;
}

/** Tread depth is required on new listings (free text like "8/32in" or "new"). */
export function requireTreadDepth(raw) {
  return cleanStr(raw, LIMITS.treadDepth, { required: true, field: "Tread depth" });
}

/**
 * "102 H" for display. A stored speed rating that isn't in the valid set (old
 * rows where a seller typed mph) is dropped, so the page never shows "102130".
 */
export function formatLoadSpeed(loadIndex, speedRating) {
  const load = loadIndex ? String(loadIndex).trim() : "";
  const speed = isValidSpeedRating(speedRating) ? speedRating : "";
  return [load, speed].filter(Boolean).join(" ") || null;
}
