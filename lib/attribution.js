// First-touch signup attribution (Dev 2026-09-23, ledger row "TT paid-ads tracking pre-flight" part 1).
// A first-party cookie remembers where a visitor FIRST came from (utm_* tags or an outside referrer), and
// signup copies it into the AuditLog meta, so every new account says which post, ad or site sent it.
// No third-party pixel, no schema change. Direct visits set nothing, so a later tagged visit still counts,
// and an existing cookie is never overwritten (first touch wins). Edge-safe: no Node APIs.

export const SRC_COOKIE = "tt_src";
export const SRC_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const OWN_HOSTS = ["shoptiretrader.com", "tirekind.com"];

function clean(v, max = 80) {
  return String(v || "").replace(/[^\w\-.~:/@ ]/g, "").trim().slice(0, max);
}

function isOwnHost(host) {
  return OWN_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

// Returns the cookie payload object for this landing, or null when there's nothing worth recording.
export function firstTouch(url, referer, now = Date.now()) {
  const out = {};
  for (const k of UTM_KEYS) {
    const v = clean(url.searchParams.get(k));
    if (v) out[k.slice(4)] = v; // utm_source -> source
  }
  if (referer) {
    try {
      const host = new URL(referer).hostname.toLowerCase();
      if (host && !isOwnHost(host) && host !== url.hostname.toLowerCase()) out.ref = clean(host, 100);
    } catch {
      /* unparseable referer: ignore */
    }
  }
  if (!Object.keys(out).length) return null;
  out.land = clean(url.pathname, 100) || "/";
  out.at = new Date(now).toISOString().slice(0, 10);
  return out;
}

export function encodeSource(obj) {
  return encodeURIComponent(JSON.stringify(obj));
}

// Parse the cookie value back into a small, sanitized object (null if absent or malformed).
export function decodeSource(raw) {
  if (!raw) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(raw));
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const out = {};
    for (const k of ["source", "medium", "campaign", "content", "term", "ref", "land", "at"]) {
      if (obj[k]) out[k] = clean(obj[k], 100);
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
