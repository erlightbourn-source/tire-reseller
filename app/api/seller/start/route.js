import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, freeYearFromNow, sellerStatus } from "@/lib/auth";

// Upgrade a buyer into a seller and start their free first year.
// No payment is taken — the $10/month only applies after the free year ends.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  // Already an active seller (free or paid) — nothing to do.
  const status = sellerStatus(user);
  if (status === "free" || status === "paid") {
    return NextResponse.json({ ok: true, already: true });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "seller",
      // Only grant a fresh free year if they've never had one.
      sellerFreeUntil: user.sellerFreeUntil ?? freeYearFromNow(),
    },
  });

  return NextResponse.json({ ok: true });
}
