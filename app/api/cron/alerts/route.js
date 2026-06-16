import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildListingWhere } from "@/lib/listingFilter";
import { sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { bearerMatches } from "@/lib/security";

export const dynamic = "force-dynamic";

// Saved-search digest. Run on a schedule (e.g. Vercel Cron). Secured by a bearer
// token: set CRON_SECRET — Vercel automatically sends it on cron invocations, and
// you can trigger manually with the same token. Fails closed if unset.
export async function GET(req) {
  if (!bearerMatches(req, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const searches = await prisma.savedSearch.findMany({
    include: { user: { select: { email: true, name: true, deletedAt: true } } },
    take: 1000,
  });

  const now = new Date();
  const byUser = new Map(); // email -> { name, items: [{label, count, samples}] }
  const checkedIds = [];

  for (const s of searches) {
    if (!s.user || s.user.deletedAt) continue;
    checkedIds.push(s.id);
    const params = Object.fromEntries(new URLSearchParams(s.query));
    const AND = [
      ...buildListingWhere(params),
      { hidden: false },
      { createdAt: { gt: s.lastSeenAt } },
      { seller: { deletedAt: null } },
    ];
    const matches = await prisma.listing.findMany({
      where: { AND },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { brand: true, size: true, priceCents: true, location: true },
    });
    if (matches.length === 0) continue;
    const entry = byUser.get(s.user.email) || { name: s.user.name, items: [] };
    entry.items.push({ label: s.label, count: matches.length, samples: matches });
    byUser.set(s.user.email, entry);
  }

  let emailed = 0;
  for (const [email, { name, items }] of byUser) {
    // Strip control chars from the display name — cleanStr only trims the ends,
    // so an interior newline would otherwise inject lines into this email body.
    const safeName = String(name || "there").replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
    const lines = items.map((it) => {
      const sub = it.samples.map((m) => `   • ${m.brand} ${m.size} — ${formatPrice(m.priceCents)} (${m.location})`).join("\n");
      return ` - ${it.label}: ${it.count} new\n${sub}`;
    });
    await sendEmail({
      to: email,
      subject: "New tire matches on TireTrader",
      text: `Hi ${safeName},\n\nNew listings matching your saved searches:\n\n${lines.join("\n\n")}\n\nBrowse them: ${SITE_URL}/browse\n\nManage alerts: ${SITE_URL}/saved`,
    });
    emailed++;
  }

  if (checkedIds.length) {
    await prisma.savedSearch.updateMany({ where: { id: { in: checkedIds } }, data: { lastSeenAt: now } });
  }

  // No-account email alerts (buyer demand capture). Only CONFIRMED alerts get
  // digests (double opt-in), so we never mail an address that didn't opt in.
  const alerts = await prisma.emailAlert.findMany({ where: { confirmed: true }, take: 2000 });
  const alertIds = [];
  let alertsEmailed = 0;
  for (const a of alerts) {
    alertIds.push(a.id);
    const params = Object.fromEntries(new URLSearchParams(a.query));
    const AND = [...buildListingWhere(params), { hidden: false }, { createdAt: { gt: a.lastSeenAt } }, { seller: { deletedAt: null } }];
    const matches = await prisma.listing.findMany({
      where: { AND },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { brand: true, size: true, priceCents: true, location: true },
    });
    if (matches.length === 0) continue;
    const sub = matches.map((m) => ` • ${m.brand} ${m.size} — ${formatPrice(m.priceCents)} (${m.location})`).join("\n");
    const unsubUrl = `${SITE_URL}/unsubscribe?token=${a.token}`;
    await sendEmail({
      to: a.email,
      subject: `New tires matching "${a.label}"`,
      text: `New listings matching your alert (${a.label}):\n\n${sub}\n\nBrowse: ${SITE_URL}/browse${a.query ? `?${a.query}` : ""}\n\nUnsubscribe: ${unsubUrl}`,
      // RFC 8058 one-click unsubscribe (POST to the API), plus the page link.
      headers: {
        "List-Unsubscribe": `<${SITE_URL}/api/email-alerts/unsubscribe?token=${a.token}>, <${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    alertsEmailed++;
  }
  if (alertIds.length) {
    await prisma.emailAlert.updateMany({ where: { id: { in: alertIds } }, data: { lastSeenAt: now } });
  }

  return NextResponse.json({
    ok: true,
    searchesChecked: checkedIds.length,
    usersEmailed: emailed,
    alertsChecked: alertIds.length,
    alertsEmailed,
  });
}
