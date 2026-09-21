// Pure, dependency-free validation + rate-limit primitives. Kept separate from
// lib/security.js (which pulls in next/server + "server-only") so this logic is
// unit-testable in a plain Node process.

/* ----------------------------- rate limiting ----------------------------- */

const BUCKETS = new Map(); // key -> { count, resetAt }

let lastSweep = 0;
function sweep(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of BUCKETS) if (v.resetAt <= now) BUCKETS.delete(k);
}

/** Fixed-window limiter. Returns { ok, retryAfter? } (retryAfter in seconds). */
export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  sweep(now);
  const b = BUCKETS.get(key);
  if (!b || b.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, remaining: limit - b.count };
}

/* ------------------------------ validation ------------------------------ */

export const LIMITS = {
  name: 80,
  email: 160,
  location: 120,
  brand: 60,
  size: 32,
  treadDepth: 24,
  loadIndex: 8,
  speedRating: 4,
  description: 4000,
  message: 4000,
  review: 2000,
  query: 600,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(v) {
  return typeof v === "string" && v.length <= LIMITS.email && EMAIL_RE.test(v);
}

export class ValidationError extends Error {}

/** Trim, enforce a max length, throw on over-cap. Returns null for empty. */
export function cleanStr(v, max, { required = false, field = "field" } = {}) {
  if (v == null || v === "") {
    if (required) throw new ValidationError(`${field} is required.`);
    return null;
  }
  const s = String(v).trim();
  if (!s) {
    if (required) throw new ValidationError(`${field} is required.`);
    return null;
  }
  if (s.length > max) throw new ValidationError(`${field} is too long (max ${max} characters).`);
  return s;
}

// Photo URLs we accept on listings: host-served uploads, inline data images, or
// our object-store public URLs (Cloudflare R2; legacy Vercel Blob kept for any
// pre-port data). Blocks arbitrary remote URLs (SSRF/abuse surface).
// Inline data images are limited to base64-encoded RASTER types only — we must
// NOT accept `data:image/svg+xml` (SVG can carry script) or comma-delimited
// (non-base64) data URLs, which could smuggle markup that breaks out of the
// JSON-LD <script> on listing pages. 2 MB cap bounds payload size.
const DATA_IMG_RE = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/;

// R2 public URLs: the default `pub-<hash>.r2.dev` host, or a configured custom
// domain (R2_PUBLIC_BASE_URL, e.g. https://uploads.shoptiretrader.com). The
// custom base is matched by prefix so we don't open a broad host allowlist.
const R2_DEV_RE = /^https:\/\/[a-z0-9-]+\.r2\.dev\//;
function matchesR2Base(u) {
  const base = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return base.length > 0 && u.startsWith(base + "/");
}

export function isAllowedPhotoUrl(u) {
  return (
    typeof u === "string" &&
    (u.startsWith("/uploads/") ||
      (DATA_IMG_RE.test(u) && u.length < 2_000_000) ||
      R2_DEV_RE.test(u) ||
      matchesR2Base(u) ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(u))
  );
}

export function clampInt(v, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
