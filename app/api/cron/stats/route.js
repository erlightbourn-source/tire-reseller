import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bearerMatches } from "@/lib/security";
import { isRealEmail, normEmail } from "@/lib/realEmail";

export const dynamic = "force-dynamic";

// Read-only counts for the fleet scorecard (the TireKind size-alert opt-ins live
// in Postgres, not MailerLite, so the scorecard showed 0). Bearer-gated
// (CRON_SECRET), fails closed if unset. Returns counts only, never addresses.
export async function GET(req) {
  if (!bearerMatches(req, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [confirmed, unconfirmedRows] = await Promise.all([
    prisma.emailAlert.findMany({ where: { confirmed: true }, select: { email: true } }),
    prisma.emailAlert.count({ where: { confirmed: false } }),
  ]);
  const distinct = new Set(confirmed.map((r) => normEmail(r.email)));
  const real = [...distinct].filter(isRealEmail);
  return NextResponse.json({
    emailAlerts: {
      confirmedRows: confirmed.length,
      confirmedDistinct: distinct.size,
      confirmedReal: real.length,
      unconfirmedRows,
    },
    time: new Date().toISOString(),
  });
}
