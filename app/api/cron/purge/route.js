import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bearerMatches } from "@/lib/security";

export const dynamic = "force-dynamic";

const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

// Permanently remove accounts whose 7-day soft-delete grace has elapsed.
// Bearer-gated (CRON_SECRET); fails closed if unset.
export async function GET(req) {
  if (!bearerMatches(req, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - GRACE_MS);
  const stale = await prisma.user.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true },
    take: 500,
  });
  // Cascades remove listings, threads, messages, favorites, etc. (schema FKs).
  if (stale.length) {
    await prisma.user.deleteMany({ where: { id: { in: stale.map((u) => u.id) } } });
  }

  return NextResponse.json({ ok: true, purged: stale.length });
}
