import "server-only";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/validation";

// Re-export the pure validation/limit primitives so existing route imports
// (`from "@/lib/security"`) keep working; the pure logic lives in lib/validation.js
// so it stays unit-testable without Next's server runtime.
export { rateLimit, LIMITS, isEmail, ValidationError, cleanStr, clampInt, isAllowedPhotoUrl } from "@/lib/validation";

/** Best-effort client IP from proxy headers (falls back to a constant). */
export function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Enforce a limit and return a 429 Response, or null if allowed. */
export function enforceRateLimit(req, action, opts) {
  const res = rateLimit(`${action}:${clientIp(req)}`, opts);
  if (res.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(res.retryAfter || 60) } }
  );
}
