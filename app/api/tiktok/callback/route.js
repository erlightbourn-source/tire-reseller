import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/security";
import { SITE_URL } from "@/lib/site";
import { consumeState, exchangeCode, tiktokShareEnabledFor } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

function back(lid, status) {
  const path = lid ? `/sell/${lid}/tiktok` : "/dashboard";
  const res = NextResponse.redirect(`${SITE_URL}${path}?tiktok=${status}`, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// TikTok redirects here after the consent screen with ?code&state (or ?error).
export async function GET(req) {
  const user = await getCurrentUser();
  if (!tiktokShareEnabledFor(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const st = await consumeState(sp.get("state"), user.id);
  if (!st) return back(null, "expired");
  if (sp.get("error") || !sp.get("code")) return back(st.lid, "cancelled");

  try {
    const t = await exchangeCode(user.id, sp.get("code"));
    const granted = String(t.scope || "").split(",");
    await logAudit("tiktok.connect", { userId: user.id, ip: clientIp(req), meta: { scopes: granted } });
    // Posting needs video.publish (post now) or video.upload (send to drafts); user.info.basic
    // shows which account is connected. Anything less and the share page can't work.
    if (!granted.includes("user.info.basic") || !(granted.includes("video.publish") || granted.includes("video.upload"))) {
      return back(st.lid, "scopes");
    }
    return back(st.lid, "connected");
  } catch {
    return back(st.lid, "failed");
  }
}
