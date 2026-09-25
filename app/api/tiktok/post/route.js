import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp, enforceRateLimit } from "@/lib/security";
import {
  getAccessToken,
  isOwnedMediaUrl,
  photoExt,
  signedMediaUrl,
  tiktokApi,
  tiktokShareEnabledFor,
} from "@/lib/tiktok";

export const dynamic = "force-dynamic";

const TITLE_MAX = 90; // TikTok photo-post title limit (UTF-16 units)
const DESC_MAX = 4000;
const PRIVACY = new Set(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"]);

function text(v, max) {
  // eslint-disable-next-line no-control-regex
  let t = String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
  // Don't leave half an emoji (a lone high surrogate) at the cut.
  if (/[\ud800-\udbff]$/.test(t)) t = t.slice(0, -1);
  return t;
}

const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

// Sends the seller's chosen listing photos to TikTok, only after they pressed Post
// on the share page (explicit consent). "direct" posts to their profile with the
// privacy/interaction/disclosure settings they picked; "draft" sends the photos to
// their TikTok inbox so they finish the post inside the TikTok app.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!tiktokShareEnabledFor(user)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const limited = await enforceRateLimit(req, "tiktok-post", { key: user.id, limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;

  let b;
  try {
    b = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  if (b.consent !== true) return bad("Please confirm before posting.");
  const mode = b.mode === "draft" ? "draft" : b.mode === "direct" ? "direct" : null;
  if (!mode) return bad("Choose how to share.");

  const listing = await prisma.listing.findUnique({
    where: { id: String(b.listingId || "") },
    select: { id: true, sellerId: true, status: true, hidden: true, photos: { orderBy: { sort: "asc" } } },
  });
  if (!listing || listing.sellerId !== user.id) return bad("Listing not found.", 404);
  if (listing.status !== "active" || listing.hidden) return bad("Only active listings can be shared.");

  const byId = new Map(listing.photos.map((p) => [p.id, p]));
  const chosen = (Array.isArray(b.photoIds) ? b.photoIds : [])
    .map((id) => byId.get(String(id)))
    .filter((p) => p && isOwnedMediaUrl(p.url) && photoExt(p.url));
  const unique = [...new Map(chosen.map((p) => [p.id, p])).values()].slice(0, 35);
  if (unique.length === 0) return bad("Pick at least one JPG or WEBP photo.");
  const cover = Math.min(Math.max(0, Number(b.coverIndex) || 0), unique.length - 1);

  const title = text(b.title, TITLE_MAX);
  const description = text(b.description, DESC_MAX);

  const at = await getAccessToken(user.id);
  if (!at) return bad("Your TikTok account is not connected. Connect it and try again.", 401);

  const post_info = { title, description };
  if (mode === "direct") {
    // Re-check creator info server-side so the request always honors the account's
    // current settings (the page shows the same data to the seller).
    const ci = await tiktokApi(at, "/v2/post/publish/creator_info/query/", {});
    if (!ci.ok) return bad("TikTok says this account can't post right now. Please try again later.", 409);
    const options = ci.data?.privacy_level_options || [];
    const privacy = String(b.privacyLevel || "");
    if (!PRIVACY.has(privacy) || !options.includes(privacy)) return bad("Choose who can see this post.");

    const disclose = b.disclose === true;
    const yourBrand = disclose && b.yourBrand === true;
    const branded = disclose && b.brandedContent === true;
    if (disclose && !yourBrand && !branded) {
      return bad("You need to indicate if your content promotes yourself, a third party, or both.");
    }
    if (branded && privacy === "SELF_ONLY") return bad("Branded content visibility cannot be set to private.");

    Object.assign(post_info, {
      privacy_level: privacy,
      disable_comment: ci.data?.comment_disabled ? true : b.allowComment !== true,
      auto_add_music: b.autoAddMusic === true,
      brand_content_toggle: branded,
      brand_organic_toggle: yourBrand,
    });
  }

  const photo_images = await Promise.all(unique.map((p) => signedMediaUrl(p.url)));
  const r = await tiktokApi(at, "/v2/post/publish/content/init/", {
    post_info,
    source_info: { source: "PULL_FROM_URL", photo_cover_index: cover, photo_images },
    post_mode: mode === "direct" ? "DIRECT_POST" : "MEDIA_UPLOAD",
    media_type: "PHOTO",
  });

  await logAudit("tiktok.post", {
    userId: user.id,
    ip: clientIp(req),
    meta: { listingId: listing.id, mode, photos: unique.length, code: r.error.code, privacy: post_info.privacy_level || null },
  });

  if (!r.ok) {
    const msg = {
      unaudited_client_can_only_post_to_private_accounts:
        "While TireKind's TikTok integration is in review, it can only post to private TikTok accounts.",
      spam_risk_too_many_posts: "You've reached TikTok's daily post limit. Please try again tomorrow.",
      spam_risk_user_banned_from_posting: "TikTok isn't allowing this account to post right now.",
      spam_risk_too_many_pending_share: "You have too many uploads waiting in your TikTok inbox. Finish or delete them first.",
      reached_active_user_cap: "TikTok's daily limit for TireKind is reached. Please try again tomorrow.",
      privacy_level_option_mismatch: "That privacy option isn't available for this account.",
      app_version_check_failed: "Update the TikTok app (31.8 or newer) to receive drafts.",
      access_token_invalid: "Your TikTok connection expired. Reconnect and try again.",
      scope_not_authorized: "TireKind doesn't have permission to post for this account. Reconnect and approve posting.",
    }[r.error.code];
    return bad(msg || `TikTok couldn't accept the post (${r.error.code}).`, 502);
  }
  return NextResponse.json({ ok: true, publishId: r.data?.publish_id || null, mode });
}
