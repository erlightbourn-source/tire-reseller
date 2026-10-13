// Pre-launch site lock (L2236, Evan 2026-10-13: password-protect the site until the Jan 1 launch).
// HTTP Basic Auth gate called FIRST from middleware.js. Edge-runtime safe: no Node crypto, no imports.
//   SITE_LOCK=1            turns it on (anything else = off, requests pass untouched)
//   SITE_LOCK_PASSWORD     the shared password; username is always "tirekind"
// Fails CLOSED: lock on + no password configured = every gated request gets 401.
// Never gated (everything else, including every other /api route, needs the password):
//   /api/stripe/webhook      Stripe calls it (signature-verified)
//   /api/cron/*              Vercel cron + tirekind-cron Worker (CRON_SECRET bearer)
//   /api/health              uptime monitors; returns only {ok, db, time}
//   /api/tiktok/media/<tok>  TikTok pulls post photos from it (short-lived signed token, 404 otherwise)
//   robots.txt, favicon.ico, /_next/static, /_next/image
// Form POSTs and data GETs (/api/listings, /api/inquiry, /api/auth/*, ...) are called from gated pages, and
// browsers resend the cached Basic credentials on same-origin fetches, so they stay locked.

export const LOCK_USER = "tirekind";

const EXEMPT_EXACT = new Set(["/robots.txt", "/favicon.ico", "/api/stripe/webhook", "/api/health"]);
const EXEMPT_PREFIX = ["/api/cron/", "/api/tiktok/media/", "/_next/static/", "/_next/image"];

export function isLockExempt(pathname) {
  if (EXEMPT_EXACT.has(pathname)) return true;
  return EXEMPT_PREFIX.some((p) => pathname.startsWith(p));
}

// Length-guarded constant-time compare (Edge has no crypto.timingSafeEqual). Runs over the longer
// of the two inputs and folds the length difference into the result, so timing doesn't reveal either.
export function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function parseBasic(header) {
  if (!header || !/^basic\s/i.test(header)) return null;
  let decoded;
  try {
    const bin = atob(header.replace(/^basic\s+/i, "").trim());
    decoded = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const i = decoded.indexOf(":");
  if (i < 0) return null;
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

function challenge() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="TireKind (pre-launch)", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

// Returns a 401 Response when the request must be blocked, or null to let it continue.
export function siteLock(req, env = process.env) {
  if (env.SITE_LOCK !== "1") return null;
  if (isLockExempt(new URL(req.url).pathname)) return null;
  const password = env.SITE_LOCK_PASSWORD;
  if (!password) return challenge(); // fail closed
  const cred = parseBasic(req.headers.get("authorization"));
  if (!cred) return challenge();
  // Evaluate both so a wrong user takes the same time as a wrong password.
  const okUser = safeEqual(cred.user, LOCK_USER);
  const okPass = safeEqual(cred.pass, password);
  return okUser && okPass ? null : challenge();
}
