import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import { AUTHORIZE_URL, SCOPES, issueState, redirectUri, tiktokShareEnabledFor } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

const ID_RE = /^[a-z0-9]{10,40}$/;

// Start the Login Kit round trip: TikTok shows the seller its own consent screen
// (which account, which permissions); we only ever get a code back if they approve.
export async function GET(req) {
  const user = await getCurrentUser();
  if (!tiktokShareEnabledFor(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const limited = await enforceRateLimit(req, "tiktok-connect", { key: user.id, limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const lid = new URL(req.url).searchParams.get("listing");
  const state = await issueState(user.id, lid && ID_RE.test(lid) ? lid : null);

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY);
  url.searchParams.set("scope", SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("state", state);
  // Always show the account picker so a seller can choose which TikTok account to connect.
  url.searchParams.set("disable_auto_auth", "1");
  const res = NextResponse.redirect(url.toString(), 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
