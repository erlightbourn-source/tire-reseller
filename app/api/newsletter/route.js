import { NextResponse } from "next/server";
import { enforceRateLimit, isEmail } from "@/lib/security";

// TireKind newsletter signup → MailerLite "TireKind — Subscribers" group.
// Posts server-side to MailerLite's PUBLIC form endpoint (the same one the
// hosted form uses), so no API key lives in the app and the page CSP stays
// 'self'. MailerLite runs the double opt-in email itself; nobody is added as
// active until they click it. Kept separate from /api/email-alerts on purpose:
// alert opt-ins are listing alerts, not marketing consent.
const ML_FORM = "https://assets.mailerlite.com/jsonp/2657000/forms/199468381437429374/subscribe";

export async function POST(req) {
  const limited = await enforceRateLimit(req, "newsletter", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const addr = String(body.email || "").trim().toLowerCase();
  if (!isEmail(addr)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  // Per-address cap so the endpoint can't be used to spam one inbox with opt-in mail.
  const addrLimited = await enforceRateLimit(req, "newsletter-addr", { key: addr, limit: 3, windowMs: 60 * 60 * 1000 });
  if (addrLimited) return addrLimited;

  const form = new URLSearchParams({ "fields[email]": addr, "ml-submit": "1", anticsrf: "true" });
  try {
    const res = await fetch(ML_FORM, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success !== true) {
      console.error("newsletter: mailerlite rejected", res.status);
      return NextResponse.json({ error: "Couldn't sign you up right now. Try again in a minute." }, { status: 502 });
    }
  } catch (e) {
    console.error("newsletter: mailerlite unreachable", e?.name);
    return NextResponse.json({ error: "Couldn't sign you up right now. Try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
