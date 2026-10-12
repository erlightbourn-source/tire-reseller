// "Rather talk before you sign up?" founding-seller interest form (Dev 2026-10-11, ledger L1421).
// Pure + dependency-free so it is unit-testable in plain Node; the route (app/api/founding-interest/route.js)
// does the I/O. Two fields only: a name (or shop name) and one way to reach the person (email OR 10-digit US phone).
import { isEmail, LIMITS } from "./validation.js";

export const INTEREST_ACTION = "founding_seller_interest";
export const INTEREST_PAGE = "/founding-seller";
// Version of the consent text shown next to the submit button (Quinn 2026-10-11: Fla. Stat. 501.059 needs prior
// express written consent for automated sales texts). Stored on every lead so we can prove what was agreed to.
// Bump it whenever the wording in FoundingInterestForm changes.
export const INTEREST_CONSENT_VERSION = "v1-2026-10-11";
export const INTEREST_INBOX = "erlightbourn@gmail.com";
export const NAME_MAX = 80;
export const NAME_ERROR = "Add your name or your shop's name.";
export const CONTACT_ERROR = "Add an email or a phone number we can reach you at.";

// Characters that make a Reply-To value a list, display-name, or comment instead of one bare address.
const UNSAFE_ADDR_RE = /[,;<>"'()\[\]\\]/;

function oneLine(s, max) {
  return String(s == null ? "" : s).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

/** "(954) 555-0123", "954.555.0123", "+1 954 555 0123" -> "9545550123"; anything else -> null. */
export function normalizeUsPhone(v) {
  const s = String(v == null ? "" : v).trim();
  if (!s || /[^\d\s().+-]/.test(s)) return null;
  let d = s.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return null;
  // NANP: area code and exchange can't start with 0 or 1.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return null;
  return d;
}

function formatPhone(d) {
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Validate a raw JSON body. Returns { ok:true, data:{name,contact,kind} } | { ok:false, status, error, silent? }.
 *  `silent` = honeypot hit: the route answers with a fake success so bots learn nothing. */
export function parseFoundingInterest(raw) {
  const b = raw && typeof raw === "object" ? raw : {};
  if (typeof b.company === "string" && b.company.trim() !== "") return { ok: false, status: 200, error: "ok", silent: true };

  const name = oneLine(b.name, NAME_MAX + 1);
  if (!name) return { ok: false, status: 400, error: NAME_ERROR };
  if (name.length > NAME_MAX) return { ok: false, status: 400, error: `Keep your name under ${NAME_MAX} characters.` };

  const rawContact = typeof b.contact === "string" ? b.contact.trim() : "";
  if (!rawContact || rawContact.length > LIMITS.email) return { ok: false, status: 400, error: CONTACT_ERROR };
  if (rawContact.includes("@")) {
    const email = rawContact.toLowerCase();
    if (!isEmail(email) || UNSAFE_ADDR_RE.test(email)) return { ok: false, status: 400, error: CONTACT_ERROR };
    return { ok: true, data: { name, contact: email, kind: "email" } };
  }
  const phone = normalizeUsPhone(rawContact);
  if (!phone) return { ok: false, status: 400, error: CONTACT_ERROR };
  return { ok: true, data: { name, contact: formatPhone(phone), kind: "phone" } };
}

/** The lead email Miles's 09:30 run finds via `subject:"TireKind founding-seller interest"`. */
export function buildInterestEmail({ name, contact, kind, page = INTEREST_PAGE, at = new Date() }) {
  const subject = `TireKind founding-seller interest: ${name}`;
  const text =
    `New founding-seller interest on TireKind.\n\n` +
    `Name: ${name}\n` +
    `${kind === "phone" ? "Phone" : "Email"}: ${contact}\n` +
    `Page: ${page}\n` +
    `Received: ${at.toISOString()}\n\n` +
    `They agreed to be contacted by email, phone or text about selling on TireKind. ` +
    `Listing is free during launch, no card.`;
  return { subject, text, ...(kind === "email" ? { headers: { "Reply-To": contact } } : {}) };
}
