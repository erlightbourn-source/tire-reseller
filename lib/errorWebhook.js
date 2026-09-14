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
