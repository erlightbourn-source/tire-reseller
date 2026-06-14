import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE = "tt_session";

// Sessions are signed JWTs. In production we refuse to fall back to a known
// default secret — that would let anyone forge a session cookie. Set APP_SECRET
// (32+ random chars) in the environment before deploying.
if (process.env.NODE_ENV === "production" && (!process.env.APP_SECRET || process.env.APP_SECRET.length < 16)) {
  throw new Error("APP_SECRET must be set to a strong value in production.");
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

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** Returns the current user record, or null if not logged in. */
export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const user = await prisma.user.findUnique({ where: { id: payload.uid } });
    return user;
  } catch {
    return null;
  }
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

/** True when the user is allowed to create/manage listings. */
export function canSell(user) {
  const s = sellerStatus(user);
  return s === "free" || s === "paid";
}

/** Backwards-compatible alias. */
export function isActiveSeller(user) {
  return canSell(user);
}

/** One year of free selling from now, as a Date. */
export function freeYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}
