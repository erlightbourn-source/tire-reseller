// Guest "Ask the seller" inquiry (Dev 2026-10-07, ledger weekly-audit idea 3). Pure + dependency-free so
// it is unit-testable in plain Node. The route (app/api/inquiry/route.js) does the I/O.
//
// Ships DARK: the whole flow is off unless GUEST_INQUIRY=on in the runtime env. Off => the API 404s and
// the listing page shows only the existing "Log in to message" card.
import { isEmail, LIMITS } from "./validation.js";
import { isRealEmail, normEmail } from "./realEmail.js";

export const INQUIRY_MAX = 600;
export const INQUIRY_MIN = 10;

export function guestInquiryEnabled(env = (typeof process !== "undefined" ? process.env : {})) {
  return String(env.GUEST_INQUIRY || "").trim().toLowerCase() === "on";
}

const URL_RE = /(https?:\/\/|www\.)\S+/gi;
// A link needs no scheme ("evil.com/pay", "t.me/x", "bit.ly/y"); catch common link/shortener TLDs.
// Decimals and sizes ("6.5/32", "225/45R17.5", "e.g.") never match: the label must be letters/digits/hyphens and the TLD a known one.
const BARE_DOMAIN_RE = /\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|io|co|us|me|ly|gl|to|cc|tk|xyz|top|info|biz|app|shop|store|site|online|link|click|live|club|ru|cn)\b/i;
// Characters that make a Reply-To value a list, display-name, or comment instead of one bare address.
const UNSAFE_ADDR_RE = /[,;<>"'()\[\]\\]/;

function oneLine(s, max) {
  return String(s || "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

/** Validate raw JSON body. Returns { ok:true, data } | { ok:false, status, error, silent? }.
 *  `silent` = honeypot hit: the route returns a fake success so bots learn nothing. */
export function parseGuestInquiry(raw) {
  const b = raw && typeof raw === "object" ? raw : {};
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, status: 200, error: "ok", silent: true };

  const listingId = typeof b.listingId === "string" ? b.listingId.trim() : "";
  if (!listingId || listingId.length > 64) return { ok: false, status: 400, error: "Listing not found." };

  const email = normEmail(b.email);
  if (!isEmail(email) || email.length > LIMITS.email || UNSAFE_ADDR_RE.test(email)) return { ok: false, status: 400, error: "Enter a valid email address." };
  // A throwaway/test address would just burn the seller's inbox with a message nobody can answer.
  if (!isRealEmail(email)) return { ok: false, status: 400, error: "Enter a valid email address." };

  const question = String(b.question == null ? "" : b.question).replace(/\r\n/g, "\n").trim();
  if (question.length < INQUIRY_MIN) return { ok: false, status: 400, error: "Add a few words so the seller knows what you want to know." };
  if (question.length > INQUIRY_MAX) return { ok: false, status: 400, error: `Keep it under ${INQUIRY_MAX} characters.` };
  // Spam guard: a relayed form must not become a link-drop channel to sellers.
  if ((question.match(URL_RE) || []).length > 0 || BARE_DOMAIN_RE.test(question)) return { ok: false, status: 400, error: "Please leave links out of your question." };

  return { ok: true, data: { listingId, email, question } };
}

/** The email the seller receives. Reply-To is the buyer so a plain reply reaches them. */
export function buildInquiryEmail({ listingTitle, buyerEmail, question, listingUrl, safetyNote }) {
  const item = oneLine(listingTitle, 120) || "your listing";
  const subject = `A buyer has a question about ${item} — TireKind`;
  const text =
    `Someone without a TireKind account asked about "${item}":\n\n` +
    `${question}\n\n` +
    `Reply to this email to answer them directly (${buyerEmail}).\n` +
    `Your listing: ${listingUrl}\n\n` +
    `${safetyNote ? safetyNote + "\n\n" : ""}` +
    `You're getting this because your listing accepts questions from visitors. ` +
    `Their address was shared only with you, for this question.`;
  return { subject, text, headers: { "Reply-To": buyerEmail } };
}
