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
// Vercel Blob public URLs. Blocks arbitrary remote URLs (SSRF/abuse surface).
export function isAllowedPhotoUrl(u) {
  return (
    typeof u === "string" &&
    (u.startsWith("/uploads/") ||
      u.startsWith("data:image/") ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(u))
  );
}

export function clampInt(v, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
