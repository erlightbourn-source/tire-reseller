import { NextResponse } from "next/server";

// This middleware does two things on every (non-static) request:
//  1. CSRF defense-in-depth: reject state-changing API requests from a foreign
//     origin. Browsers attach an Origin header to cross-origin mutations, so a
//     mismatch means a forged cross-site request. Requests with NO Origin
//     (server-to-server, e.g. the signature-verified Stripe webhook) pass.
//  2. Per-request Content-Security-Policy with a nonce, so we can serve a strict
//     script-src ('self' 'nonce-…' 'strict-dynamic') in production instead of
//     'unsafe-inline'/'unsafe-eval'. Next.js reads the nonce from the CSP we set
//     on the request headers and stamps it onto its own inline/bootstrap scripts.
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

function buildCsp(nonce) {
  const dev = process.env.NODE_ENV !== "production";
  // Dev needs 'unsafe-eval'/'unsafe-inline' for React Refresh / HMR. Production
  // locks scripts to the per-request nonce + strict-dynamic (chunks loaded by the
  // nonced bootstrap are trusted transitively).
  const scriptSrc = dev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  return [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    // next/font + Tailwind emit inline styles; nonce-ing styles is impractical,
    // and style injection is far lower risk than script injection.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // plausible.io is allowed for the optional, env-flagged analytics: the script
    // host (loaded via next/script, trusted transitively by strict-dynamic) and
    // the event beacon it POSTs to (connect-src). Harmless when analytics is off.
    `script-src ${scriptSrc} https://plausible.io`,
    "connect-src 'self' https://plausible.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function middleware(req) {
  // 1) CSRF check on mutating requests.
  if (!SAFE.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      let originHost = "";
      try { originHost = new URL(origin).host; } catch { originHost = ""; }
      if (!host || originHost !== host) {
        return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
      }
    }
  }

  // 2) Nonce CSP. crypto is a Web Crypto global in the Edge runtime.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp); // Next reads the nonce from here

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Run on pages (for CSP) and API routes (for CSRF), but skip static assets and
  // public files that don't need a per-request nonce.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js).*)",
  ],
};
