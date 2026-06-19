import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashResetToken } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Confirm a new account's email from the link we sent. Verifying an account the
// user themselves requested is benign, so a GET link is fine. Atomic single-use.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    const hash = hashResetToken(token);
    await prisma.user.updateMany({
      where: { verifyTokenHash: hash, verifyTokenExpiry: { gt: new Date() } },
      data: { emailVerified: true, verifyTokenHash: null, verifyTokenExpiry: null },
    });
  }
  // Always land on login (don't reveal whether the token was valid).
  return NextResponse.redirect(`${SITE_URL}/login?verified=1`);
}
