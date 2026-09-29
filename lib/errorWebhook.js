import { oneLine } from "./format.js";

// The single log line for a client error report. Every field is unauthenticated
// input: `url` used to be logged uncapped and raw, so a CR/LF in it could forge
// extra "[client-error] ..." (or any other) lines in the host logs and in the
// webhook's text. Each field is collapsed to one capped line.
export function buildErrorLine(data = {}) {
  const url = oneLine(data?.url, 300) || "?";
  const message = oneLine(data?.message, 500);
  const digest = oneLine(data?.digest, 200);
  return `[client-error] ${url} :: ${message}${digest ? ` (digest ${digest})` : ""}`;
}

// Builds the outbound payload for ERROR_WEBHOOK_URL (Slack/Logtail/Sentry-tunnel).
// `data` is UNAUTHENTICATED client input (the /api/client-error route body) — this
// picks fields explicitly rather than spreading `data` wholesale, so a caller can't
// inject arbitrary webhook fields (Slack `blocks`/`channel`/`attachments`, or any
// key a downstream JSON-log consumer treats specially).
export function buildWebhookPayload(line, data = {}) {
  return {
    text: line,
    url: String(data?.url || "").slice(0, 500),
    digest: String(data?.digest || "").slice(0, 200),
  };
}
