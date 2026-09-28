import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security";
import { buildWebhookPayload, buildErrorLine } from "@/lib/errorWebhook";

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

  if (!data || typeof data !== "object") data = {};
  const line = buildErrorLine(data);
  // eslint-disable-next-line no-console
  console.error(line);

  const hook = process.env.ERROR_WEBHOOK_URL;
  if (hook) {
    try {
      // buildWebhookPayload picks fields explicitly — `data` is unauthenticated
      // client input, and spreading it into the outbound payload would let an
      // attacker inject arbitrary Slack fields (`blocks`, `channel`,
      // `attachments`) or poison a Logtail/Sentry webhook's schema.
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildWebhookPayload(line, data)),
      });
    } catch {
      /* webhook is best-effort */
    }
  }

  return new NextResponse(null, { status: 204 });
}
