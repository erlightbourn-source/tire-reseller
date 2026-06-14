/** @type {import('next').NextConfig} */

// Content Security Policy. Next.js (App Router) injects inline bootstrap scripts
// and next/font emits inline styles, so we allow 'unsafe-inline' there rather
// than wiring per-request nonces. The non-script directives still meaningfully
// constrain where content can load from, and frame-ancestors blocks clickjacking.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We use the Geolocation API for "near me", so allow it for same-origin only.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise the framework/version
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
