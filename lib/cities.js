// Broward-first launch cities for TireTrader's local landing pages.
// One indexable URL per city (/used-tires/[slug]) is the core local-SEO play
// from Ada's 7/19 brief. Each city carries a short, factual geographic note so
// the pages are genuinely differentiated, not thin duplicate/doorway content.
//
// `note` = neutral, verifiable geography only (no invented claims). `county` is
// carried for future Miami-Dade / Palm Beach expansion (Broward launches first).

export const CITIES = [
  { slug: "fort-lauderdale", name: "Fort Lauderdale", county: "Broward",
    note: "Broward County's coastal seat and largest city." },
  { slug: "pompano-beach", name: "Pompano Beach", county: "Broward",
    note: "A coastal city in northeast Broward, just north of Fort Lauderdale." },
  { slug: "hollywood", name: "Hollywood", county: "Broward",
    note: "A coastal city in south Broward, between Fort Lauderdale and Miami." },
  { slug: "coral-springs", name: "Coral Springs", county: "Broward",
    note: "A planned community in northwest Broward." },
  { slug: "pembroke-pines", name: "Pembroke Pines", county: "Broward",
    note: "One of the largest cities in southwest Broward." },
  { slug: "miramar", name: "Miramar", county: "Broward",
    note: "A fast-growing city in southern Broward on the Miami-Dade line." },
  { slug: "davie", name: "Davie", county: "Broward",
    note: "A central-west Broward town known for its large-lot, semi-rural character." },
  { slug: "sunrise", name: "Sunrise", county: "Broward",
    note: "A central Broward city, home to the Sawgrass Mills area." },
  { slug: "deerfield-beach", name: "Deerfield Beach", county: "Broward",
    note: "A coastal city in northern Broward, on the Palm Beach County line." },
  { slug: "plantation", name: "Plantation", county: "Broward",
    note: "A central Broward city just west of Fort Lauderdale." },
];

export function cityBySlug(slug) {
  return CITIES.find((c) => c.slug === String(slug || "").toLowerCase()) || null;
}
