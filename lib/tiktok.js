import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt, SignJWT, jwtVerify } from "jose";
import { SITE_URL } from "@/lib/site";

// "Share your listing to TikTok" — a seller connects their own TikTok account
// (Login Kit) and posts their listing photos through the Content Posting API.
//
// Design notes:
//  - Feature flag TIKTOK_SHARE: "off" (default: every route 404s, no UI),
//    "allowlist" (only users in TIKTOK_SHARE_ALLOWLIST, by user id or email),
//    "on" (every seller). Prod stays "allowlist" until TikTok approves the app.
//  - The seller's TikTok tokens are never stored in our database. They live in
//    an encrypted (A256GCM) httpOnly cookie in the seller's own browser, so
//    disconnecting (or clearing cookies) removes them completely.
//  - TikTok pulls the photos from a tirekind.com URL (PULL_FROM_URL requires a
//    domain we have verified). /api/tiktok/media/<signed token>.jpg streams the
//    listing photo from our storage; the token is short-lived and only ever
//    points at our own photo storage, so the route is not an open proxy.

const API = "https://open.tiktokapis.com";
export const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
export const SCOPES = ["user.info.basic", "video.upload", "video.publish"];
const TOKEN_COOKIE = "tk_tiktok";
const STATE_COOKIE = "tk_tiktok_state";

function keyFor(purpose) {
  const base = process.env.APP_SECRET || "insecure-dev-secret-change-me";
  return crypto.createHash("sha256").update(`${purpose}:${base}`).digest(); // 32 bytes
}

export function tiktokConfigured() {
  return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

/** Is the share feature available to this (logged-in) user? */
export function tiktokShareEnabledFor(user) {
  if (!user || !tiktokConfigured()) return false;
  const mode = (process.env.TIKTOK_SHARE || "off").trim().toLowerCase();
  if (mode === "on") return true;
  if (mode !== "allowlist") return false;
  const allow = (process.env.TIKTOK_SHARE_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(String(user.id).toLowerCase()) || allow.includes(String(user.email || "").toLowerCase());
}

export function redirectUri() {
  return `${SITE_URL}/api/tiktok/callback`;
}

const cookieOpts = (maxAge) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

// ---------- OAuth state (CSRF protection for the Login Kit round trip) ----------

export async function issueState(uid, listingId) {
  const state = crypto.randomBytes(24).toString("base64url");
  const jwt = await new SignJWT({ s: state, uid, lid: listingId || null })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(keyFor("tiktok-state"));
  (await cookies()).set(STATE_COOKIE, jwt, cookieOpts(600));
  return state;
}

/** Returns { lid } when the callback's state matches the cookie for this user, else null. */
export async function consumeState(state, uid) {
  const jar = await cookies();
  const raw = jar.get(STATE_COOKIE)?.value;
  jar.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  if (!raw || !state) return null;
  try {
    const { payload } = await jwtVerify(raw, keyFor("tiktok-state"), { algorithms: ["HS256"] });
    const a = Buffer.from(String(payload.s));
    const b = Buffer.from(String(state));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    if (payload.uid !== uid) return null;
    return { lid: payload.lid || null };
  } catch {
    return null;
  }
}

// ---------- Token cookie (encrypted, bound to the TireKind user) ----------

async function writeTokens(uid, t) {
  const jwe = await new EncryptJWT({
    uid,
    oid: t.open_id,
    at: t.access_token,
    ate: Date.now() + (Number(t.expires_in) || 0) * 1000,
    rt: t.refresh_token,
    rte: Date.now() + (Number(t.refresh_expires_in) || 0) * 1000,
    sc: t.scope || "",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(keyFor("tiktok-tokens"));
  const maxAge = Math.max(60, Math.floor((Number(t.refresh_expires_in) || 86400) * 0.95));
  (await cookies()).set(TOKEN_COOKIE, jwe, cookieOpts(maxAge));
}

async function readTokens(uid) {
  const raw = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtDecrypt(raw, keyFor("tiktok-tokens"));
    // A cookie minted for another TireKind account (shared computer) is ignored.
    if (payload.uid !== uid) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function clearTokens() {
  (await cookies()).set(TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
}

async function tokenRequest(params) {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    ...params,
  });
  const res = await fetch(`${API}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body,
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    const err = new Error(j.error_description || j.error || `token request failed (${res.status})`);
    err.code = j.error || "token_error";
    throw err;
  }
  return j;
}

export async function exchangeCode(uid, code) {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri() });
  await writeTokens(uid, t);
  return t;
}

/** A valid access token for this user (refreshing it if needed), or null when not connected. */
export async function getAccessToken(uid) {
  const tok = await readTokens(uid);
  if (!tok) return null;
  if (tok.ate - Date.now() > 60_000) return tok.at;
  if (!tok.rt || tok.rte <= Date.now()) {
    await clearTokens();
    return null;
  }
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: tok.rt });
    await writeTokens(uid, t);
    return t.access_token;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function revokeAndClear(uid) {
  const tok = await readTokens(uid);
  await clearTokens();
  if (!tok?.at) return;
  await fetch(`${API}/v2/oauth/revoke/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      token: tok.at,
    }),
    cache: "no-store",
  }).catch(() => {});
}

/** POST a JSON body to a Content Posting API endpoint. Returns { ok, data, error }. */
export async function tiktokApi(accessToken, path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  const code = j?.error?.code || (res.ok ? "ok" : `http_${res.status}`);
  return { ok: code === "ok", status: res.status, data: j?.data || null, error: { code, message: j?.error?.message || "" } };
}

// ---------- Short-lived signed media URLs on our verified domain ----------

// Our Vercel Blob store's public host. The store id is embedded in the read-write
// token (vercel_blob_rw_<storeId>_<secret>); TIKTOK_MEDIA_BLOB_HOST overrides it.
// Pinning the store matters: *.public.blob.vercel-storage.com is shared by every
// Vercel customer, so a bare wildcard would let the media route relay anyone's files.
function ownBlobHost() {
  const explicit = (process.env.TIKTOK_MEDIA_BLOB_HOST || "").trim().toLowerCase();
  if (explicit) return explicit;
  const m = /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(process.env.BLOB_READ_WRITE_TOKEN || "");
  return m ? `${m[1].toLowerCase()}.public.blob.vercel-storage.com` : null;
}

// Only our own photo storage may be proxied (our Vercel Blob store, or the R2 public base).
export function isOwnedMediaUrl(u) {
  if (typeof u !== "string") return false;
  const blob = ownBlobHost();
  if (blob) {
    const m = /^https:\/\/([a-z0-9-]+\.public\.blob\.vercel-storage\.com)\/uploads\/[A-Za-z0-9._-]+$/.exec(u);
    if (m && m[1] === blob) return true;
  }
  const r2 = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return !!r2 && r2.startsWith("https://") && u.startsWith(`${r2}/uploads/`) && !u.includes("..");
}

// TikTok photo posts accept JPEG and WEBP only.
export function photoExt(u) {
  const m = /\.(jpe?g|webp)$/i.exec(String(u).split("?")[0]);
  return m ? (m[1].toLowerCase() === "webp" ? "webp" : "jpg") : null;
}

export async function signedMediaUrl(sourceUrl) {
  const ext = photoExt(sourceUrl);
  const tok = await new SignJWT({ u: sourceUrl })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(keyFor("tiktok-media"));
  return `${SITE_URL}/api/tiktok/media/${tok}.${ext}`;
}

export async function verifyMediaToken(tok) {
  try {
    const { payload } = await jwtVerify(tok, keyFor("tiktok-media"), { algorithms: ["HS256"] });
    return isOwnedMediaUrl(payload.u) ? payload.u : null;
  } catch {
    return null;
  }
}

export const PRIVACY_LABELS = {
  PUBLIC_TO_EVERYONE: "Everyone",
  MUTUAL_FOLLOW_FRIENDS: "Friends",
  FOLLOWER_OF_CREATOR: "Followers",
  SELF_ONLY: "Only me",
};
