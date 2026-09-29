// Canonical public base URL for SEO (sitemap, canonical/OG tags). Set
// NEXT_PUBLIC_SITE_URL in the environment when you deploy to a real host.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tiretrader.example.com").replace(/\/$/, "");

// Post-login `?next=` target -> a same-origin path, or null. A plain
// `startsWith("/") && !startsWith("//")` check is NOT enough: the URL parser
// treats "\" as "/" and silently drops tab/CR/LF, so "/\evil.com" or
// "/<TAB>/evil.com" (both pass that check) resolve to https://evil.com — an open
// redirect off our login page. Reject backslashes/control chars outright, then
// confirm the resolved origin is still ours and hand back only path+query+hash.
export function safeNextPath(raw, origin) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    const base = new URL(origin);
    const u = new URL(raw, base);
    if (u.origin !== base.origin) return null;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

// Slug helpers so brand URLs are clean and reversible enough to match back.
export function brandSlug(brand) {
  return String(brand).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Tire-size slug for SEO landing pages: "225/45R17" → "225-45r17".
export function sizeSlug(size) {
  return String(size).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
