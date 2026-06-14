import "server-only";
import { NextResponse } from "next/server";

// Lightweight, dependency-free security helpers for the API routes:
//   - an in-memory rate limiter (good enough for a single-instance MVP; swap for
//     Redis/Upstash when you scale horizontally)
//   - input validation + length caps so user data can't be abused to bloat
//     storage, smuggle huge payloads, or stuff unexpected types into the DB.

/* ----------------------------- rate limiting ----------------------------- */

const BUCKETS = new Map(); // key -> { count, resetAt }

// Periodically drop expired buckets so the Map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of BUCKETS) if (v.resetAt <= now) BUCKETS.delete(k);
}

/**
 * Fixed-window limiter. Returns { ok, retryAfter } where retryAfter is seconds.
 * @param {string} key  unique per client+action, e.g. `login:1.2.3.4`
 */
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

/** Best-effort client IP from proxy headers (falls back to a constant). */
export function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Convenience: enforce a limit and return a 429 Response, or null if allowed. */
export function enforceRateLimit(req, action, opts) {
  const res = rateLimit(`${action}:${clientIp(req)}`, opts);
  if (res.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(res.retryAfter || 60) } }
  );
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

/**
 * Coerce to a trimmed string and enforce a max length. Returns null for empty.
 * Throws a ValidationError when over the cap so callers can 400 cleanly.
 */
export class ValidationError extends Error {}

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

export function clampInt(v, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
