import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResendBody } from "../lib/emailPayload.js";
import { buildInquiryEmail } from "../lib/guestInquiry.js";

const base = { from: "TireKind <noreply@tirekind.com>", to: "seller@example.com", subject: "s", text: "t" };

test("Reply-To in headers becomes top-level reply_to (Resend drops it inside headers)", () => {
  const body = buildResendBody({ ...base, headers: { "Reply-To": "buyer@example.com" } });
  assert.equal(body.reply_to, "buyer@example.com");
  assert.equal(body.headers, undefined, "no empty headers object left behind");
});

test("Reply-To is matched case-insensitively and other headers pass through", () => {
  const body = buildResendBody({
    ...base,
    headers: { "reply-to": "b@example.com", "List-Unsubscribe": "<https://x/u>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
  assert.equal(body.reply_to, "b@example.com");
  assert.deepEqual(body.headers, { "List-Unsubscribe": "<https://x/u>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
});

test("no headers -> no reply_to and no headers keys (unchanged body for every other email)", () => {
  const body = buildResendBody(base);
  assert.deepEqual(Object.keys(body).sort(), ["from", "subject", "text", "to"]);
});

test("the guest-inquiry email reaches Resend with reply_to = the buyer", () => {
  const mail = buildInquiryEmail({
    listingTitle: "Michelin 225/45R17", buyerEmail: "buyer@example.com",
    question: "Is this set still available?", listingUrl: "https://tirekind.com/listings/x", safetyNote: "",
  });
  const body = buildResendBody({ ...base, ...mail });
  assert.equal(body.reply_to, "buyer@example.com");
  assert.equal(body.headers, undefined);
});
