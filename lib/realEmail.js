// Pure "is this a real subscriber?" check for fleet reporting. Mirrors
// ~/.claude/scheduled-tasks/lib/email-list-tracker.py is_real() so the TireKind
// size-alert count in the fleet scorecard uses the same rule as MailerLite:
// excludes Evan's own addresses (+ plus/dot aliases), the brands' own
// accounts/domains, example.* and disposable/test domains, and test-named locals.
const EVAN_LOCALS = new Set(["erlightbourn"]);
const FLEET_EXACT = new Set(["elightbourn@gatelesis.com", "travelandfinancetips@gmail.com"]);
const FLEET_DOMAINS = new Set(["travelfinancetips.com", "elvorogolf.com", "shoptiretrader.com", "tirekind.com"]);
const TEST_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "test.com", "mail.tm", "mailinator.com",
  "guerrillamail.com", "sharklasers.com", "yopmail.com", "10minutemail.com",
  "temp-mail.org", "tempmail.com", "dispostable.com", "maildrop.cc", "getnada.com",
  "trashmail.com", "mailnesia.com", "emailondeck.com", "1secmail.com", "inboxkitten.com",
  "punkproof.com", "tiffincrane.com", "fakeinbox.com", "moakt.com",
]);

/** Canonical form used for de-duplication: lowercased, trimmed. */
export function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isRealEmail(email) {
  const e = normEmail(email);
  const at = e.lastIndexOf("@");
  if (at < 1) return false;
  const local = e.slice(0, at);
  const dom = e.slice(at + 1);
  let base = local.split("+", 1)[0];
  if (dom === "gmail.com" || dom === "googlemail.com") base = base.replaceAll(".", "");
  if (EVAN_LOCALS.has(base) || FLEET_EXACT.has(e) || FLEET_EXACT.has(`${base}@${dom}`)) return false;
  if (FLEET_DOMAINS.has(dom) || TEST_DOMAINS.has(dom) || dom.endsWith(".test") || dom.endsWith(".invalid")) return false;
  if (/^(test|tester|testing|canary)[\d._-]*$/.test(base) || local.includes("+test")) return false;
  return true;
}
