import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessToken, tiktokApi, tiktokShareEnabledFor } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

// TikTok's guidelines require fresh creator info every time the share page renders:
// nickname/avatar (which account), allowed privacy levels, disabled interactions,
// and whether the creator can post right now.
export async function GET() {
  const user = await getCurrentUser();
  if (!tiktokShareEnabledFor(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const at = await getAccessToken(user.id);
  if (!at) return NextResponse.json({ connected: false });

  const r = await tiktokApi(at, "/v2/post/publish/creator_info/query/", {});
  if (r.error.code === "access_token_invalid") return NextResponse.json({ connected: false });
  if (!r.ok) {
    // e.g. spam_risk_too_many_posts / spam_risk_user_banned_from_posting / reached_active_user_cap
    return NextResponse.json({ connected: true, canPost: false, reason: r.error.code });
  }
  const d = r.data || {};
  return NextResponse.json({
    connected: true,
    canPost: true,
    creator: {
      avatar: d.creator_avatar_url || null,
      username: d.creator_username || "",
      nickname: d.creator_nickname || "",
      privacyOptions: Array.isArray(d.privacy_level_options) ? d.privacy_level_options : [],
      commentDisabled: !!d.comment_disabled,
      duetDisabled: !!d.duet_disabled,
      stitchDisabled: !!d.stitch_disabled,
      maxVideoSec: d.max_video_post_duration_sec ?? null,
    },
  });
}
