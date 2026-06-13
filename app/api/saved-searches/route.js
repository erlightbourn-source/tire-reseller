import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { describeSearch } from "@/lib/listingFilter";
import { stateName } from "@/lib/states";

const ALLOWED = ["q", "brand", "condition", "size", "maxPrice", "season", "runFlat", "state"];

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to save searches." }, { status: 401 });

  const { query } = await req.json();
  const sp = new URLSearchParams(query || "");
  const params = {};
  for (const k of ALLOWED) if (sp.get(k)) params[k] = sp.get(k);
  const cleanQuery = new URLSearchParams(params).toString();
  const label = describeSearch(params, stateName);

  // Avoid duplicates
  const dup = await prisma.savedSearch.findFirst({ where: { userId: user.id, query: cleanQuery } });
  if (dup) return NextResponse.json({ ok: true, id: dup.id, duplicate: true });

  const saved = await prisma.savedSearch.create({
    data: { userId: user.id, query: cleanQuery, label },
  });
  return NextResponse.json({ ok: true, id: saved.id });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { id } = await req.json();
  await prisma.savedSearch.updateMany({ where: { id, userId: user.id }, data: { lastSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { id } = await req.json();
  await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
