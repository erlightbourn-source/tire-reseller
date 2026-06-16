import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/validation";

/** Constant-time `Authorization: Bearer <secret>` check. Fails closed when the
 *  secret is unset. Used to gate cron endpoints without leaking the secret via
 *  response timing. */
export function bearerMatches(req, secret) {
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

// Re-export the pure validation/limit primitives so existing route imports
// (`from "@/lib/security"`) keep working; the pure logic lives in lib/validation.js
// so it stays unit-testable without Next's server runtime.
export { rateLimit, LIMITS, isEmail, ValidationError, cleanStr, clampInt, isAllowedPhotoUrl } from "@/lib/validation";

// Warn loudly once if we're deployed without a shared rate-limit store — the
// in-memory limiter resets per serverless instance, so limits don't actually
// hold across a fleet. (See DEPLOY.md: set UPSTASH_REDIS_REST_URL/TOKEN.)
if (
  (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV) &&
  !(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
) {
  console.warn(
    "[security] No UPSTASH_REDIS_* configured: rate limiting is in-memory and " +
      "will NOT hold across serverless instances. Set Upstash in production."
  );
}

/** Best-effort client IP. Prefer platform-trusted headers (Vercel sets these to
 *  the real edge-observed client and they can't be spoofed by the client) over
 *  the raw X-Forwarded-For, whose left-most value an attacker can forge to cycle
 *  rate-limit buckets. */
export function clientIp(req) {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

// Distributed fixed-window limit via Upstash Redis REST (shared across serverless
// instances). Returns { ok, retryAfter } or throws so the caller can fall back.
async function upstashLimit(key, limit, windowMs) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const auth = { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" };
  const k = encodeURIComponent(key);
  const windowSec = Math.ceil(windowMs / 1000);

  const incrRes = await fetch(`${base}/incr/${k}`, auth);
  if (!incrRes.ok) throw new Error("upstash incr failed");
  const count = (await incrRes.json()).result;
  if (count === 1) {
    await fetch(`${base}/expire/${k}/${windowSec}`, auth).catch(() => {});
  }
  if (count > limit) {
    let ttl = windowSec;
    try {
      const t = await fetch(`${base}/ttl/${k}`, auth);
      const v = (await t.json()).result;
      if (typeof v === "number" && v > 0) ttl = v;
    } catch {}
    return { ok: false, retryAfter: ttl };
  }
  return { ok: true };
}

/** Enforce a limit and return a 429 Response, or null if allowed. Async so it can
 *  use a shared Upstash store when configured (required for serverless). */
export async function enforceRateLimit(req, action, opts = {}) {
  // opts.key overrides the per-IP bucket (e.g. limit by account email too), so a
  // distributed/IP-rotating attack against one account still gets throttled.
  const key = opts.key ? `${action}:${opts.key}` : `${action}:${clientIp(req)}`;
  const { limit = 10, windowMs = 60_000 } = opts;

  let res;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      res = await upstashLimit(key, limit, windowMs);
    } catch {
      res = rateLimit(key, opts); // network/Upstash hiccup → degrade to in-memory
    }
  } else {
    res = rateLimit(key, opts);
  }

  if (res.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(res.retryAfter || 60) } }
  );
}
