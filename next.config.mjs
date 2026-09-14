/** @type {import('next').NextConfig} */

// NOTE: Content-Security-Policy is set per-request in middleware.js so it can
// carry a unique nonce and use a strict script-src in production (no
// 'unsafe-inline'/'unsafe-eval'). The static headers below cover everything else.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We use the Geolocation API for "near me", so allow it for same-origin only.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

// The pre-app static site lived at *.html URLs. Keep those links (search
// results, old outreach, bookmarks) alive with permanent redirects to the
// app-router equivalents instead of 404s.
const legacyRedirects = [
  { source: "/index.html", destination: "/", permanent: true },
  { source: "/about.html", destination: "/about", permanent: true },
  { source: "/how-it-works.html", destination: "/how-it-works", permanent: true },
  { source: "/sell-your-tires.html", destination: "/sell-tires", permanent: true },
  { source: "/founding-seller.html", destination: "/founding-seller", permanent: true },
  { source: "/trust-safety.html", destination: "/trust-safety", permanent: true },
  { source: "/locations.html", destination: "/locations", permanent: true },
  { source: "/browse-listings.html", destination: "/browse", permanent: true },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise the framework/version
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
