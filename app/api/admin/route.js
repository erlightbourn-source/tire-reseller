import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { enforceRateLimit, clientIp } from "@/lib/security";
import { logAudit } from "@/lib/audit";

// Moderator actions. All require an admin account.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const limited = await enforceRateLimit(req, "admin", { key: user.id, limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { action, id } = await req.json();
  if (typeof id !== "string" || !id || id.length > 64) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  // Every action targets a row that must exist: 404, not a 500 from Prisma's P2025.
  try {
    switch (action) {
      case "hideListing": {
        const listing = await prisma.listing.findUnique({ where: { id }, select: { seller: { select: { admin: true } } } });
        if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
        if (listing.seller?.admin) return NextResponse.json({ error: "You can't hide another admin's listing." }, { status: 403 });
        // hiddenByAdmin keeps the hide sticky: account reactivation (login) only
        // restores listings the seller's own soft-delete hid, never moderator hides.
        await prisma.listing.update({ where: { id }, data: { hidden: true, hiddenByAdmin: true } });
        break;
      }
      case "unhideListing":
        await prisma.listing.update({ where: { id }, data: { hidden: false, hiddenByAdmin: false } });
        break;
      case "deleteListing":
        await prisma.listing.delete({ where: { id } });
        break;
      case "banUser": {
        if (id === user.id) return NextResponse.json({ error: "You can't ban yourself." }, { status: 400 });
        const target = await prisma.user.findUnique({ where: { id }, select: { admin: true } });
        if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
        if (target.admin) return NextResponse.json({ error: "You can't ban another admin." }, { status: 403 });
        // bannedAt is the durable flag (login/session/reset refuse it; purge never
        // deletes the row, so the email stays blocked from re-signup). deletedAt is
        // kept so existing soft-delete filters keep hiding the account.
        const now = new Date();
        await prisma.user.update({ where: { id }, data: { bannedAt: now, deletedAt: now, tokenVersion: { increment: 1 } } });
        await prisma.listing.updateMany({ where: { sellerId: id }, data: { hidden: true, hiddenByAdmin: true } });
        break;
      }
      case "unbanUser":
        // Clears the ban, not the listings: the admin re-shows listings one by one.
        await prisma.user.update({ where: { id }, data: { bannedAt: null, deletedAt: null } });
        break;
      case "makeFounding":
        // Grant founding status + mirror onto the seller's listings so the badge
        // and ranked placement (sellerPro) apply immediately without a re-list.
        await prisma.user.update({ where: { id }, data: { foundingSeller: true } });
        await prisma.listing.updateMany({ where: { sellerId: id }, data: { sellerFounding: true, sellerPro: true } });
        break;
      case "unmakeFounding": {
        await prisma.user.update({ where: { id }, data: { foundingSeller: false } });
        // Revert placement to the seller's paid-Pro status, not a hard false.
        const target = await prisma.user.findUnique({ where: { id }, select: { pro: true } });
        await prisma.listing.updateMany({ where: { sellerId: id }, data: { sellerFounding: false, sellerPro: !!target?.pro } });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    if (err?.code === "P2025") return NextResponse.json({ error: "Not found." }, { status: 404 });
    throw err;
  }

  await logAudit(`admin_${action}`, { userId: user.id, ip: clientIp(req), meta: { target: id } });
  return NextResponse.json({ ok: true });
}
