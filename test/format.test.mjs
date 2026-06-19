import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, timeAgo } from "../lib/format.js";

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
