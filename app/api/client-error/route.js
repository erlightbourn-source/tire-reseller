import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

// Collects client-side errors from the React error boundaries. Logs them (the
// host captures stdout — e.g. Vercel) so client crashes are no longer invisible,
// and forwards to ERROR_WEBHOOK_URL when set (a Slack/Logtail/Sentry-tunnel URL).
// Unauthenticated by design (anon users hit errors too) but rate-limited + capped.
export async function POST(req) {
  // Throttle hard; on the error path we never want to add an error, so a 429
  // still returns 204 (silently dropped).
  const limited = await enforceRateLimit(req, "client-error", { limit: 30, windowMs: 60_000 });
  if (limited) return new NextResponse(null, { status: 204 });

  let data = {};
  try {
    data = JSON.parse((await req.text()).slice(0, 8000)) || {};
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const line = `[client-error] ${data.url || "?"} :: ${String(data.message || "").slice(0, 500)}`;
  // eslint-disable-next-line no-console
  console.error(line, data.digest ? `(digest ${data.digest})` : "");

  const hook = process.env.ERROR_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: line, ...data }),
      });
    } catch {
      /* webhook is best-effort */
    }
  }

  return new NextResponse(null, { status: 204 });
}
