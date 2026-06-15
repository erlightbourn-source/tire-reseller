import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// One-click unsubscribe from an email link (GET, token is the secret).
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    await prisma.emailAlert.deleteMany({ where: { token } });
  }
  return NextResponse.redirect(`${SITE_URL}/unsubscribed`);
}
