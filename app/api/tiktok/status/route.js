import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import { getAccessToken, tiktokApi, tiktokShareEnabledFor } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

// Polled by the share page after posting so the seller sees where their post is.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!tiktokShareEnabledFor(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const limited = await enforceRateLimit(req, "tiktok-status", { key: user.id, limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  const { publishId } = await req.json().catch(() => ({}));
  if (typeof publishId !== "string" || !publishId || publishId.length > 64) {
    return NextResponse.json({ ok: false, error: "Missing publish id." }, { status: 400 });
  }
  const at = await getAccessToken(user.id);
  if (!at) return NextResponse.json({ ok: false, error: "Not connected." }, { status: 401 });

  const r = await tiktokApi(at, "/v2/post/publish/status/fetch/", { publish_id: publishId });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error.code }, { status: 502 });
  return NextResponse.json({
    ok: true,
    status: r.data?.status || "UNKNOWN", // PROCESSING_DOWNLOAD | SEND_TO_USER_INBOX | PUBLISH_COMPLETE | FAILED
    failReason: r.data?.fail_reason || null,
  });
}
