import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseFoundingInterest, buildInterestEmail, normalizeUsPhone,
  NAME_ERROR, CONTACT_ERROR, NAME_MAX, INTEREST_PAGE, INTEREST_CONSENT_VERSION,
} from "../lib/foundingInterest.js";

const ok = { name: "Mike's Tire Shop", contact: "Mike@Shop.com" };

test("valid email lead: name trimmed, email lowercased, kind=email", () => {
  const r = parseFoundingInterest({ ...ok, name: "  Mike's   Tire Shop " });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, { name: "Mike's Tire Shop", contact: "mike@shop.com", kind: "email" });
});

test("valid phone lead: any common US format normalizes to (xxx) xxx-xxxx", () => {
  for (const v of ["(954) 555-0123", "954.555.0123", "954-555-0123", "9545550123", "+1 954 555 0123", "1-954-555-0123"]) {
    const r = parseFoundingInterest({ name: "Mike", contact: v });
    assert.equal(r.ok, true, v);
    assert.deepEqual(r.data, { name: "Mike", contact: "(954) 555-0123", kind: "phone" }, v);
  }
});

test("phone: rejects short, long, letters, bad NANP prefixes", () => {
  for (const v of ["555-0123", "954555012", "95455501234", "(954) 555-01ab", "054-555-0123", "954-155-0123", "+44 20 7946 0958"]) {
    assert.equal(normalizeUsPhone(v), null, v);
    const r = parseFoundingInterest({ name: "Mike", contact: v });
    assert.equal(r.ok, false, v);
    assert.equal(r.error, CONTACT_ERROR);
    assert.equal(r.status, 400);
  }
});

test("missing / blank name -> name error; missing / blank contact -> contact error", () => {
  assert.equal(parseFoundingInterest({ ...ok, name: "   " }).error, NAME_ERROR);
  assert.equal(parseFoundingInterest({ contact: ok.contact }).error, NAME_ERROR);
  assert.equal(parseFoundingInterest({ ...ok, contact: "" }).error, CONTACT_ERROR);
  assert.equal(parseFoundingInterest({ name: ok.name }).error, CONTACT_ERROR);
  assert.equal(parseFoundingInterest(null).error, NAME_ERROR);
  assert.equal(parseFoundingInterest("nope").error, NAME_ERROR);
});

test("name over the cap is rejected, at the cap is fine", () => {
  assert.equal(parseFoundingInterest({ ...ok, name: "a".repeat(NAME_MAX) }).ok, true);
  assert.equal(parseFoundingInterest({ ...ok, name: "a".repeat(NAME_MAX + 1) }).ok, false);
});

test("bad or header-injecting emails are rejected", () => {
  for (const v of ["mike@", "@shop.com", "mike shop@x.com", "a@b.com, c@d.com", "<a@b.com>", 'x"y@b.com', "mike@shop.com\nBcc: x@y.com"]) {
    assert.equal(parseFoundingInterest({ ...ok, contact: v }).ok, false, JSON.stringify(v));
  }
});

test("non-string contact/name types do not throw", () => {
  assert.equal(parseFoundingInterest({ name: 5, contact: 5 }).ok, false);
  assert.equal(parseFoundingInterest({ name: ["a"], contact: { x: 1 } }).ok, false);
});

test("honeypot: filled 'company' = silent fake success", () => {
  const r = parseFoundingInterest({ ...ok, company: "Acme" });
  assert.equal(r.ok, false); assert.equal(r.silent, true); assert.equal(r.status, 200);
  assert.equal(parseFoundingInterest({ ...ok, company: "  " }).ok, true, "blank honeypot is fine");
});

test("lead email: exact subject Miles greps for, one-line name, Reply-To only for email leads", () => {
  const at = new Date("2026-10-11T15:00:00Z");
  const e = buildInterestEmail({ name: "Mike's Tire Shop", contact: "mike@shop.com", kind: "email", at });
  assert.equal(e.subject, "TireKind founding-seller interest: Mike's Tire Shop");
  assert.ok(e.text.includes("Name: Mike's Tire Shop") && e.text.includes("Email: mike@shop.com"));
  assert.ok(e.text.includes(`Page: ${INTEREST_PAGE}`) && e.text.includes("2026-10-11T15:00:00.000Z"));
  assert.deepEqual(e.headers, { "Reply-To": "mike@shop.com" });
  const p = buildInterestEmail({ name: "Mike", contact: "(954) 555-0123", kind: "phone", at });
  assert.ok(p.text.includes("Phone: (954) 555-0123"));
  assert.equal(p.headers, undefined, "no Reply-To for a phone lead");
});

test("name with newlines can't break the subject line", () => {
  const r = parseFoundingInterest({ name: "Mike\r\nBcc: x@y.com", contact: "mike@shop.com" });
  assert.equal(r.ok, true);
  assert.ok(!/[\r\n]/.test(buildInterestEmail(r.data).subject));
});

test("consent text is versioned for the AuditLog row (Quinn 2026-10-11)", () => {
  assert.match(INTEREST_CONSENT_VERSION, /^v\d+-\d{4}-\d{2}-\d{2}$/);
});
