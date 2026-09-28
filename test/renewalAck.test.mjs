import { test } from "node:test";
import assert from "node:assert/strict";
import { renewalAckEmail, fmtAmount } from "../lib/renewalAck.js";

test("fmtAmount formats USD minor units and other currencies", () => {
  assert.equal(fmtAmount(1000, "usd"), "$10.00");
  assert.equal(fmtAmount(2500), "$25.00");
  assert.equal(fmtAmount(1200, "eur"), "12.00 EUR");
});

test("renewalAckEmail states price, auto-renewal and how to cancel", () => {
  const { subject, text } = renewalAckEmail({ unitAmount: 2500, siteUrl: "https://tirekind.com/" });
  assert.equal(subject, "Your TireKind Seller subscription is active");
  assert.match(text, /\$25\.00\/month/);
  assert.match(text, /renews automatically every month until you cancel/);
  assert.match(text, /https:\/\/tirekind\.com\/dashboard/);
  assert.match(text, /Manage or cancel plan/);
  assert.match(text, /hello@tirekind\.com/);
  assert.match(text, /https:\/\/tirekind\.com\/terms/);
  assert.match(text, /E\.V\. Tech Solutions LLC/);
  assert.doesNotMatch(text, /free period/);
});

test("renewalAckEmail adds the trial end and first-charge date when trialing", () => {
  const trialEnd = Date.UTC(2026, 9, 26) / 1000; // Oct 26 2026
  const { text } = renewalAckEmail({ unitAmount: 1000, trialEnd, siteUrl: "https://tirekind.com" });
  assert.match(text, /free period ends October 26, 2026/);
  assert.match(text, /first charge of \$10\.00 is on October 26, 2026/);
});
