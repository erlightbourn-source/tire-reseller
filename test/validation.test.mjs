import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanStr, clampInt, isEmail, ValidationError, rateLimit } from "../lib/validation.js";

test("cleanStr trims and returns the value", () => {
  assert.equal(cleanStr("  hi  ", 10), "hi");
});

test("cleanStr returns null for empty optional values", () => {
  assert.equal(cleanStr("", 10), null);
  assert.equal(cleanStr(null, 10), null);
  assert.equal(cleanStr("   ", 10), null);
});

test("cleanStr throws when required value is missing", () => {
  assert.throws(() => cleanStr("", 10, { required: true, field: "Name" }), ValidationError);
});

test("cleanStr throws when over the max length", () => {
  assert.throws(() => cleanStr("abcdef", 3), ValidationError);
});

test("isEmail accepts valid and rejects invalid", () => {
  assert.ok(isEmail("a@b.co"));
  assert.ok(!isEmail("nope"));
  assert.ok(!isEmail("a@b"));
  assert.ok(!isEmail("a b@c.com"));
  assert.ok(!isEmail(123));
});

test("clampInt clamps, rounds, and falls back", () => {
  assert.equal(clampInt("5", { min: 1, max: 10 }), 5);
  assert.equal(clampInt(0, { min: 1, max: 10, fallback: 1 }), 1);
  assert.equal(clampInt(99, { min: 1, max: 10 }), 10);
  assert.equal(clampInt("x", { min: 1, max: 10, fallback: 4 }), 4);
  assert.equal(clampInt(4.6, { min: 1, max: 10 }), 5);
});

test("rateLimit allows up to the limit then blocks", () => {
  const key = "test-" + Math.floor(Math.random() * 1e9);
  for (let i = 0; i < 3; i++) assert.ok(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok);
  const blocked = rateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.ok(!blocked.ok);
  assert.ok(blocked.retryAfter > 0);
});
