import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashResetToken } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Confirm a double-opt-in email alert from the link we emailed. Activating an
// alert the recipient themselves requested is benign, so a GET link is fine
// (unlike unsubscribe, which deletes and so requires a POST).
//
// The confirm token is stored HASHED at rest (see app/api/email-alerts/route.js),
// so hash the plaintext from the URL before matching — a leaked DB row can't be
// replayed to confirm alerts.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    await prisma.emailAlert.updateMany({
      where: { confirmToken: hashResetToken(token) },
      data: { confirmed: true, confirmToken: null },
    });
  }
  return NextResponse.redirect(`${SITE_URL}/alerts-confirmed`);
}
