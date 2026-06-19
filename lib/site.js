// Canonical public base URL for SEO (sitemap, canonical/OG tags). Set
// NEXT_PUBLIC_SITE_URL in the environment when you deploy to a real host.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tiretrader.example.com").replace(/\/$/, "");

// Slug helpers so brand URLs are clean and reversible enough to match back.
export function brandSlug(brand) {
  return String(brand).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Tire-size slug for SEO landing pages: "225/45R17" → "225-45r17".
export function sizeSlug(size) {
  return String(size).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
