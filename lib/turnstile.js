import "server-only";
import { NextResponse } from "next/server";
import { clientIp } from "@/lib/security";

// Cloudflare Turnstile (free bot check) for the logged-out forms: signup, login,
// forgot-password, newsletter, email alerts, guest inquiry. Enforced only when
// TURNSTILE_SECRET_KEY is set, so local dev, tests and the Vercel standby keep
// working unchanged. The browser half is components/useTurnstile.js.
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const FAIL = { error: "Please complete the security check and try again.", code: "turnstile" };

/** Returns a 400 Response when the token is missing/invalid, or null when allowed. */
export async function checkTurnstile(req, token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return null;
  if (typeof token !== "string" || !token || token.length > 2048) {
    return NextResponse.json(FAIL, { status: 400 });
  }

  const body = new URLSearchParams({ secret, response: token });
  const ip = clientIp(req);
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5_000);
  let out;
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: ctrl.signal, cache: "no-store" });
    out = await res.json();
  } catch (e) {
    // Cloudflare's verifier unreachable: don't take the whole site's signup/login
    // down with it. Rate limits still apply. A bad or missing token never gets here.
    console.error("[turnstile] siteverify unreachable, allowing request:", e?.name || "error");
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (!out?.success) return NextResponse.json(FAIL, { status: 400 });
  return null;
}
