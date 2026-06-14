import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { enforceRateLimit, clientIp } from "@/lib/security";
import { logAudit } from "@/lib/audit";

// Moderator actions. All require an admin account.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const limited = await enforceRateLimit(req, `admin:${user.id}`, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { action, id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  switch (action) {
    case "hideListing":
      await prisma.listing.update({ where: { id }, data: { hidden: true } });
      break;
    case "unhideListing":
      await prisma.listing.update({ where: { id }, data: { hidden: false } });
      break;
    case "deleteListing":
      await prisma.listing.delete({ where: { id } });
      break;
    case "banUser": {
      if (id === user.id) return NextResponse.json({ error: "You can't ban yourself." }, { status: 400 });
      await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), tokenVersion: { increment: 1 } } });
      await prisma.listing.updateMany({ where: { sellerId: id, hidden: false }, data: { hidden: true } });
      break;
    }
    case "unbanUser":
      await prisma.user.update({ where: { id }, data: { deletedAt: null } });
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  await logAudit(`admin_${action}`, { userId: user.id, ip: clientIp(req), meta: { target: id } });
  return NextResponse.json({ ok: true });
}
