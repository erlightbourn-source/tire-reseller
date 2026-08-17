import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newResetToken } from "@/lib/auth";
import { describeSearch } from "@/lib/listingFilter";
import { stateName } from "@/lib/states";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { enforceRateLimit, isEmail } from "@/lib/security";

const ALLOWED = ["q", "brand", "condition", "size", "maxPrice", "minTread", "minYear", "qty", "minRating", "shipping", "season", "runFlat", "state"];

// Create an email alert for a search — no account required (captures buyer demand).
export async function POST(req) {
  const limited = await enforceRateLimit(req, "emailalert", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email, query } = await req.json();
  const addr = String(email || "").toLowerCase();
  if (!isEmail(addr)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  // Per-address cap (3/hour) so the anonymous endpoint can't be used to bomb a
  // third party's inbox with unsolicited "you're set for alerts" mail by rotating
  // IPs. (A confirmation/double-opt-in flow is the fuller fix — tracked separately.)
  const addrLimited = await enforceRateLimit(req, "emailalert-addr", { key: addr, limit: 3, windowMs: 60 * 60 * 1000 });
  if (addrLimited) return addrLimited;

  // Normalize the query to the allowed filter keys.
  const sp = new URLSearchParams(String(query || "").slice(0, 600));
  const params = {};
  for (const k of ALLOWED) if (sp.get(k)) params[k] = sp.get(k);
  const cleanQuery = new URLSearchParams(params).toString();
  const label = describeSearch(params, stateName);

  // Neutral response on an existing (email, query) pair — matching the
  // enumeration-safe symmetry already used by forgot/resend-verify (BACKLOG
  // #1): an anonymous caller must not learn whether an email is already
  // registered for a given search from the response shape.
  const existing = await prisma.emailAlert.findUnique({ where: { email_query: { email: addr, query: cleanQuery } } }).catch(() => null);
  if (existing) return NextResponse.json({ ok: true });

  // Double opt-in: store UNCONFIRMED and send a confirmation request. The cron
  // only mails confirmed alerts, so we never send digests to an address that
  // didn't explicitly opt in.
  //
  // Token storage:
  //  - `confirmToken` is a ONE-TIME secret, emailed once and nulled on use — so we
  //    store its HASH at rest (mirroring reset/verify tokens in lib/auth.js) and
  //    hash the incoming token in the confirm route. A DB read can't confirm alerts.
  //  - `token` (unsubscribe) is a PERSISTENT capability that the alerts cron
  //    re-emits in the unsubscribe URL + List-Unsubscribe header on every digest
  //    (app/api/cron/alerts/route.js), so the server must be able to regenerate the
  //    link from stored data — it is stored in plaintext by design. It is a 256-bit
  //    unguessable value granting only unsubscribe (low harm). Hardening it needs a
  //    per-email HMAC redesign, not hash-at-rest — tracked in improvements/BACKLOG.md.
  const { token } = newResetToken();               // unsubscribe capability (stored plaintext by design — see note above)
  const confirm = newResetToken();                 // one-time confirm capability (hashed at rest)
  await prisma.emailAlert.create({ data: { email: addr, query: cleanQuery, label, token, confirmToken: confirm.hash } });

  await sendEmail({
    to: addr,
    subject: "Confirm your TireTrader tire alerts",
    text:
      `Confirm you want alerts when new tires match: ${label}\n\n` +
      `Confirm: ${SITE_URL}/api/email-alerts/confirm?token=${confirm.token}\n\n` +
      `If you didn't request this, just ignore this email — you won't hear from us again.`,
  });

  return NextResponse.json({ ok: true });
}
