import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const COOKIE = "tt_session";

// Sessions are signed JWTs. On any deployed environment we refuse to fall back
// to a known default secret — that would let anyone forge a session cookie.
// "Deployed" includes Vercel PREVIEW builds (NOT NODE_ENV=production), since
// preview URLs are publicly reachable. Require APP_SECRET >= 32 chars.
const IS_DEPLOYED =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_ENV === "preview";
if (IS_DEPLOYED && (!process.env.APP_SECRET || process.env.APP_SECRET.length < 32)) {
  throw new Error("APP_SECRET must be set to a strong value (32+ chars) on deployed environments.");
}
const secret = new TextEncoder().encode(
  process.env.APP_SECRET || "insecure-dev-secret-change-me"
);

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId, tokenVersion = 0) {
  const token = await new SignJWT({ uid: userId, tv: tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** Returns the current user record, or null if not logged in / session revoked. */
export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const user = await prisma.user.findUnique({ where: { id: payload.uid } });
    if (!user) return null;
    // Soft-deleted accounts are treated as logged out.
    if (user.deletedAt) return null;
    // Revoke sessions issued before the user's tokenVersion was bumped
    // (logout-everywhere, password change/reset).
    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Invalidate every existing session for a user (bumps tokenVersion) and return
 * the new version so the caller can re-issue a fresh cookie for the current device.
 */
export async function revokeSessions(userId) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  return updated.tokenVersion;
}

/**
 * Seller billing state:
 *   "none"    — not a seller (a buyer)
 *   "free"    — seller within their free first year
 *   "paid"    — seller with an active paid subscription
 *   "expired" — seller whose free year ended and isn't paying yet
 */
export function sellerStatus(user) {
  if (!user || user.role !== "seller") return "none";
  if (user.subscriptionStatus === "active") return "paid";
  if (user.sellerFreeUntil && new Date(user.sellerFreeUntil).getTime() > Date.now()) return "free";
  return "expired";
}

/** True when the user is a platform moderator. */
export function isAdmin(user) {
  return !!user && user.admin === true;
}

/** True when the user is allowed to create/manage listings. */
export function canSell(user) {
  const s = sellerStatus(user);
  return s === "free" || s === "paid";
}

/** Backwards-compatible alias. */
export function isActiveSeller(user) {
  return canSell(user);
}

/** Generate a password-reset token: returns the plaintext (emailed) + its hash (stored). */
export function newResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

/** One year of free selling from now, as a Date. */
export function freeYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}
