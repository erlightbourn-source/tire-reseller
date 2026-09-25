import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp, enforceRateLimit } from "@/lib/security";
import { revokeAndClear, tiktokShareEnabledFor } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

// Revokes TireKind's access at TikTok and deletes the token cookie.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!tiktokShareEnabledFor(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const limited = await enforceRateLimit(req, "tiktok-disconnect", { key: user.id, limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;
  await revokeAndClear(user.id);
  await logAudit("tiktok.disconnect", { userId: user.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
