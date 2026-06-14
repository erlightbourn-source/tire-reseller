import { NextResponse } from "next/server";

// CSRF defense-in-depth: reject state-changing API requests that come from a
// different origin. Browsers always attach an Origin header to cross-origin
// POST/PUT/PATCH/DELETE, so a mismatch means a forged cross-site request.
// Requests with NO Origin (server-to-server, e.g. the Stripe webhook) are
// allowed through — those can't be driven by a victim's browser.
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req) {
  if (SAFE.has(req.method)) return NextResponse.next();

  const origin = req.headers.get("origin");
  if (!origin) return NextResponse.next();

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let originHost = "";
  try { originHost = new URL(origin).host; } catch { originHost = ""; }

  if (host && originHost && originHost === host) return NextResponse.next();

  return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
}

export const config = {
  matcher: ["/api/:path*"],
};
