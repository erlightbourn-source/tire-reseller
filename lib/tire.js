// Shared tire-display vocabulary: labels, condition glossary, and small
// formatting helpers used across cards, the listing detail page, and content
// pages. Keeping these in one place avoids the label drift we had when each
// component defined its own SEASON_LABEL map.

export const SEASON_LABEL = {
  summer: "Summer",
  winter: "Winter",
  "all-season": "All-season",
  "all-weather": "All-weather",
};

export function seasonLabel(season) {
  return SEASON_LABEL[season] || season || null;
}

// Condition glossary — the source of truth for badges and the buyer guide.
// `tone` keys map to badge styles defined below.
export const CONDITIONS = {
  new: {
    label: "New",
    tone: "emerald",
    blurb: "Unused, full tread. Never mounted or only test-fitted.",
  },
  used: {
    label: "Used",
    tone: "amber",
    blurb: "Previously driven with measurable remaining tread.",
  },
  takeoff: {
    label: "Takeoff",
    tone: "sky",
    blurb: "Pulled from a new vehicle with near-full tread — like-new at a discount.",
  },
  damaged: {
    label: "Damaged",
    tone: "rose",
    blurb: "Has a patch, plug, or cosmetic/structural flaw. Inspect before buying.",
  },
};

export function conditionMeta(condition) {
  return CONDITIONS[condition] || CONDITIONS[condition === "new" ? "new" : "used"];
}

// New tires are ~10/32"–12/32". We treat tread as a string in the DB
// ("9/32in", "new", "8/32"). This normalizes it to a clean "9/32\"" display
// and, when possible, a 0–100% "life left" estimate against a 10/32 baseline.
export function parseTread(tread) {
  if (!tread) return null;
  const t = String(tread).trim().toLowerCase();
  if (t === "new") return { label: 'New (10/32")', n: 10 };
  const m = t.match(/(\d+(?:\.\d+)?)\s*\/?\s*32/);
  if (m) {
    const n = Number(m[1]);
    return { label: `${m[1]}/32"`, n };
  }
  return { label: String(tread), n: null };
}

export function treadLabel(tread) {
  return parseTread(tread)?.label || null;
}

// Rough remaining-life percentage from tread depth (10/32 ≈ 100%, 2/32 ≈ worn out).
export function treadLifePct(tread) {
  const n = parseTread(tread)?.n;
  if (n == null) return null;
  const pct = Math.round(((n - 2) / (10 - 2)) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function perTire(priceCents, quantity) {
  const qty = Math.max(1, quantity || 1);
  return Math.round(priceCents / qty);
}

// "12 mi away", "<1 mi away", "120 mi away"
export function milesLabel(miles) {
  if (miles == null || !isFinite(miles)) return null;
  if (miles < 1) return "Less than 1 mi away";
  return `${Math.round(miles)} mi away`;
}

// DOT manufacture year → age string ("2y old"), and a staleness flag.
export function tireAge(dotYear) {
  if (!dotYear) return null;
  const years = new Date().getFullYear() - dotYear;
  if (years <= 0) return { years: 0, label: "This year", aging: false };
  return { years, label: `${years}y old`, aging: years >= 6 };
}
