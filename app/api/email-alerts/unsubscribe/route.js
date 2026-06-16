import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Unsubscribe DELETES, so it must not be a prefetchable GET (mail scanners and
// link-prefetchers fire GETs and would silently unsubscribe people). The email
// links to the /unsubscribe page, which POSTs here (same-origin, CSRF-checked by
// middleware). RFC 8058 List-Unsubscribe-Post one-click unsubscribe also POSTs.
export async function POST(req) {
  let token = null;
  try {
    const form = await req.formData();
    token = form.get("token");
  } catch {
    token = null;
  }
  if (!token) token = new URL(req.url).searchParams.get("token");
  if (token) {
    await prisma.emailAlert.deleteMany({ where: { token: String(token) } });
  }
  return NextResponse.redirect(`${SITE_URL}/unsubscribed`, { status: 303 });
}
