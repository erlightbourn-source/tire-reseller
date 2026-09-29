import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, timeAgo, oneLine } from "../lib/format.js";

test("oneLine: interior line breaks can't inject lines into an email", () => {
  const evil = "Michelin\r\n\r\nYour TireKind account is locked. Verify at https://evil.example\n";
  const out = oneLine(evil, 200);
  assert.ok(!/[\r\n]/.test(out), "no CR/LF survives");
  assert.equal(out, "Michelin Your TireKind account is locked. Verify at https://evil.example");
  // Unicode line/paragraph separators, NEL, tabs and other C0/C1 controls too.
  assert.equal(oneLine("Bob\u2028Smith\u2029Jr\u0085\tX\u0000Y"), "Bob Smith Jr X Y");
});

test("oneLine: caps length, handles null, leaves normal text alone", () => {
  assert.equal(oneLine("Goodyear Eagle F1"), "Goodyear Eagle F1");
  assert.equal(oneLine("225/45R17"), "225/45R17");
  assert.equal(oneLine("abcdefghij", 4), "abcd");
  assert.equal(oneLine(null), "");
  assert.equal(oneLine(undefined), "");
});

test("formatPrice: whole dollars have no cents", () => {
  assert.equal(formatPrice(92000), "$920");
  assert.equal(formatPrice(0), "$0");
});

test("formatPrice: non-round shows two decimals", () => {
  assert.equal(formatPrice(38050), "$380.50");
  assert.equal(formatPrice(9599), "$95.99");
});

test("formatPrice: thousands separators", () => {
  assert.equal(formatPrice(124000), "$1,240");
});

test("timeAgo: recent → just now", () => {
  assert.equal(timeAgo(new Date()), "just now");
  assert.equal(timeAgo(Date.now() - 30 * 1000), "just now");
});

test("timeAgo: minutes/hours/days with pluralization", () => {
  assert.equal(timeAgo(Date.now() - 60 * 1000), "1 min ago");
  assert.equal(timeAgo(Date.now() - 5 * 60 * 1000), "5 mins ago");
  assert.equal(timeAgo(Date.now() - 60 * 60 * 1000), "1 hour ago");
  assert.equal(timeAgo(Date.now() - 3 * 86400 * 1000), "3 days ago");
});
