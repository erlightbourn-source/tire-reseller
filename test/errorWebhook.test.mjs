import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWebhookPayload } from "../lib/errorWebhook.js";

test("buildWebhookPayload only carries text/url/digest, never an attacker-injected field", () => {
  const malicious = {
    url: "/browse",
    digest: "abc123",
    // An attacker posting to /api/client-error controls the whole JSON body —
    // these keys must never reach the outbound webhook payload.
    blocks: [{ type: "section", text: { type: "mrkdwn", text: "pwned" } }],
    channel: "#exec-only",
    attachments: [{ fallback: "pwned" }],
    text: "attacker-controlled override",
  };
  const payload = buildWebhookPayload("[client-error] /browse :: boom", malicious);
  assert.deepEqual(Object.keys(payload).sort(), ["digest", "text", "url"]);
  assert.equal(payload.text, "[client-error] /browse :: boom", "text comes from the server-built line, not client input");
  assert.equal(payload.url, "/browse");
  assert.equal(payload.digest, "abc123");
});

test("buildWebhookPayload tolerates missing/non-string fields", () => {
  const payload = buildWebhookPayload("[client-error] ? :: boom", {});
  assert.equal(payload.url, "");
  assert.equal(payload.digest, "");
});

test("buildWebhookPayload caps url/digest length", () => {
  const payload = buildWebhookPayload("line", { url: "x".repeat(1000), digest: "y".repeat(1000) });
  assert.equal(payload.url.length, 500);
  assert.equal(payload.digest.length, 200);
});
