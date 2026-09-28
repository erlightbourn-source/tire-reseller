import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { describeSearch } from "@/lib/listingFilter";
import { stateName } from "@/lib/states";
import { enforceRateLimit } from "@/lib/security";

const ALLOWED = ["q", "brand", "condition", "size", "maxPrice", "minTread", "minYear", "qty", "season", "runFlat", "minRating", "shipping", "state"];
const LIMIT = { limit: 30, windowMs: 60_000 }; // per account (PATCH fires on each "mark seen")
const MAX_SAVED = 25; // matches the take:25 in app/api/notifications

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to save searches." }, { status: 401 });
  const limited = await enforceRateLimit(req, "saved-search", { key: user.id, ...LIMIT });
  if (limited) return limited;

  const { query } = await req.json();
  const sp = new URLSearchParams(String(query || "").slice(0, 600));
  const params = {};
  for (const k of ALLOWED) if (sp.get(k)) params[k] = sp.get(k);
  const cleanQuery = new URLSearchParams(params).toString();
  const label = describeSearch(params, stateName);

  // Avoid duplicates
  const dup = await prisma.savedSearch.findFirst({ where: { userId: user.id, query: cleanQuery } });
  if (dup) return NextResponse.json({ ok: true, id: dup.id, duplicate: true });

  // Per-account cap. Unbounded, one account could fill the alerts cron's
  // 1000-row batch (app/api/cron/alerts) and starve every other user's digest;
  // the notification bell only ever counts the first MAX_SAVED anyway.
  if ((await prisma.savedSearch.count({ where: { userId: user.id } })) >= MAX_SAVED) {
    return NextResponse.json(
      { error: `You can save up to ${MAX_SAVED} searches. Delete one on your Saved page to add another.`, code: "saved_search_limit" },
      { status: 400 }
    );
  }

  const saved = await prisma.savedSearch.create({
    data: { userId: user.id, query: cleanQuery, label },
  });
  return NextResponse.json({ ok: true, id: saved.id });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const limited = await enforceRateLimit(req, "saved-search", { key: user.id, ...LIMIT });
  if (limited) return limited;
  const { id } = await req.json();
  await prisma.savedSearch.updateMany({ where: { id, userId: user.id }, data: { lastSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const limited = await enforceRateLimit(req, "saved-search", { key: user.id, ...LIMIT });
  if (limited) return limited;
  const { id } = await req.json();
  await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
