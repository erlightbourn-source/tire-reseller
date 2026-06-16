import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Confirm a double-opt-in email alert from the link we emailed. Activating an
// alert the recipient themselves requested is benign, so a GET link is fine
// (unlike unsubscribe, which deletes and so requires a POST).
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    await prisma.emailAlert.updateMany({
      where: { confirmToken: token },
      data: { confirmed: true, confirmToken: null },
    });
  }
  return NextResponse.redirect(`${SITE_URL}/alerts-confirmed`);
}
