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

  // Normalize the query to the allowed filter keys.
  const sp = new URLSearchParams(String(query || "").slice(0, 600));
  const params = {};
  for (const k of ALLOWED) if (sp.get(k)) params[k] = sp.get(k);
  const cleanQuery = new URLSearchParams(params).toString();
  const label = describeSearch(params, stateName);

  const existing = await prisma.emailAlert.findUnique({ where: { email_query: { email: addr, query: cleanQuery } } }).catch(() => null);
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  const { token } = newResetToken();
  await prisma.emailAlert.create({ data: { email: addr, query: cleanQuery, label, token } });

  await sendEmail({
    to: addr,
    subject: "You're set for TireTrader alerts",
    text: `We'll email you when new tires match: ${label}\n\nBrowse now: ${SITE_URL}/browse${cleanQuery ? `?${cleanQuery}` : ""}\n\nUnsubscribe anytime: ${SITE_URL}/api/email-alerts/unsubscribe?token=${token}`,
  });

  return NextResponse.json({ ok: true });
}
