import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bearerMatches } from "@/lib/security";
import { purgeStaleUsers } from "@/lib/purge";

export const dynamic = "force-dynamic";

// Daily cleanup (vercel.json cron 0 3 * * *). Permanently removes two kinds of
// stale rows in one pass — soft-deleted accounts past their 7-day grace, AND
// abandoned unverified signups (which can never log in to self-delete). See
// lib/purge.js. Bearer-gated (CRON_SECRET); fails closed if unset.
export async function GET(req) {
  if (!bearerMatches(req, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await purgeStaleUsers(prisma);
  return NextResponse.json(result);
}
