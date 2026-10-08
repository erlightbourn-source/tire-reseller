import { test } from "node:test";
import assert from "node:assert/strict";
import { guestInquiryEnabled, parseGuestInquiry, buildInquiryEmail, INQUIRY_MAX } from "../lib/guestInquiry.js";

const ok = { listingId: "abc123", email: "Jane.Doe@Gmail.com", question: "Is the tread still above 6/32 on all four?" };

test("flag: off by default, only literal 'on' enables", () => {
  assert.equal(guestInquiryEnabled({}), false);
  assert.equal(guestInquiryEnabled({ GUEST_INQUIRY: "off" }), false);
  assert.equal(guestInquiryEnabled({ GUEST_INQUIRY: "1" }), false);
  assert.equal(guestInquiryEnabled({ GUEST_INQUIRY: " ON " }), true);
});

test("valid body parses, email normalized", () => {
  const r = parseGuestInquiry(ok);
  assert.equal(r.ok, true);
  assert.equal(r.data.email, "jane.doe@gmail.com");
  assert.equal(r.data.listingId, "abc123");
});

test("honeypot: filled 'website' = silent fake success, not an error", () => {
  const r = parseGuestInquiry({ ...ok, website: "http://spam.example" });
  assert.equal(r.ok, false); assert.equal(r.silent, true); assert.equal(r.status, 200);
});

test("rejects bad/test emails, short/long questions, links, missing listing", () => {
  for (const email of ["", "nope", "a@b", "x@mailinator.com", "test1@gmail.com", "erlightbourn@gmail.com"])
    assert.equal(parseGuestInquiry({ ...ok, email }).ok, false, email);
  assert.equal(parseGuestInquiry({ ...ok, question: "hi" }).ok, false);
  assert.equal(parseGuestInquiry({ ...ok, question: "x".repeat(INQUIRY_MAX + 1) }).ok, false);
  assert.equal(parseGuestInquiry({ ...ok, question: "Is this real? see https://evil.example/pay now" }).ok, false);
  assert.equal(parseGuestInquiry({ ...ok, question: "check www.evil.example for the price please" }).ok, false);
  assert.equal(parseGuestInquiry({ ...ok, listingId: "" }).ok, false);
  assert.equal(parseGuestInquiry(null).ok, false);
  // non-string question is coerced, never throws
  assert.doesNotThrow(() => parseGuestInquiry({ ...ok, question: { a: 1 } }));
});

test("email: Reply-To is the buyer, one-line subject even with hostile title, safety note present", () => {
  const m = buildInquiryEmail({ listingTitle: "Michelin\r\nBcc: x@y.z 225/45R17", buyerEmail: "jane@gmail.com", question: "Still available?", listingUrl: "https://tirekind.com/listings/abc", safetyNote: "Keep it on TireKind." });
  assert.equal(m.headers["Reply-To"], "jane@gmail.com");
  assert.ok(!/[\r\n]/.test(m.subject));
  assert.ok(m.text.includes("Still available?") && m.text.includes("Keep it on TireKind.") && m.text.includes("https://tirekind.com/listings/abc"));
});

test("bare-domain / shortener links are rejected too (no scheme needed to drop a link)", () => {
  for (const question of ["pay me at evil.com/checkout please", "message me on t.me/scammer about it", "see bit.ly/3abcd for the price", "Is the PAYPAL-refund.xyz deal real?"])
    assert.equal(parseGuestInquiry({ ...ok, question }).ok, false, question);
  // real tire talk must still pass: sizes, decimals, abbreviations
  for (const question of ["Is the tread 6.5/32 or better on 225/45R17.5 tires?", "e.g. are they matched, i.e. same brand?", "Do these fit a 2019 Civic. How far is pickup?"])
    assert.equal(parseGuestInquiry({ ...ok, question }).ok, true, question);
});

test("Reply-To safety: addresses with header-list/quote/angle characters are rejected", () => {
  for (const email of ["a,b@gmail.com", "a;b@gmail.com", '"a"@gmail.com', "a<b@gmail.com", "a>b@gmail.com", "a(b)@gmail.com"])
    assert.equal(parseGuestInquiry({ ...ok, email }).ok, false, email);
  assert.equal(parseGuestInquiry({ ...ok, email: "jane.doe+tires@gmail.com" }).ok, true);
});
