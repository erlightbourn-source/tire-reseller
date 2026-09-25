import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanStr, clampInt, isEmail, ValidationError, rateLimit, isAllowedPhotoUrl } from "../lib/validation.js";

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

test("isAllowedPhotoUrl accepts uploads/data/r2/blob and rejects remote", () => {
  assert.ok(isAllowedPhotoUrl("/uploads/abc.jpg"));
  assert.ok(isAllowedPhotoUrl("data:image/png;base64,xxxx"));
  assert.ok(isAllowedPhotoUrl("https://pub-abc123.r2.dev/uploads/x.jpg"));
  assert.ok(!isAllowedPhotoUrl("https://evil.example/x.jpg"));
  assert.ok(!isAllowedPhotoUrl("javascript:alert(1)"));
  assert.ok(!isAllowedPhotoUrl(42));
});

test("isAllowedPhotoUrl honors a configured R2 custom base and rejects lookalikes", () => {
  const prev = process.env.R2_PUBLIC_BASE_URL;
  process.env.R2_PUBLIC_BASE_URL = "https://uploads.shoptiretrader.com";
  assert.ok(isAllowedPhotoUrl("https://uploads.shoptiretrader.com/uploads/x.jpg"));
  assert.ok(!isAllowedPhotoUrl("https://uploads.shoptiretrader.com.evil.example/x.jpg"));
  if (prev === undefined) delete process.env.R2_PUBLIC_BASE_URL;
  else process.env.R2_PUBLIC_BASE_URL = prev;
});

test("isAllowedPhotoUrl accepts only OUR Vercel Blob store (L899)", () => {
  const keys = ["TIKTOK_MEDIA_BLOB_HOST", "BLOB_READ_WRITE_TOKEN"];
  const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    for (const k of keys) delete process.env[k];
    // No blob store configured: no blob URL can be ours.
    assert.ok(!isAllowedPhotoUrl("https://abc123.public.blob.vercel-storage.com/uploads/x.jpg"));
    // Derived from the read-write token.
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_ABC123_secretpart";
    assert.ok(isAllowedPhotoUrl("https://abc123.public.blob.vercel-storage.com/uploads/x.jpg"));
    assert.ok(!isAllowedPhotoUrl("https://someoneelse.public.blob.vercel-storage.com/uploads/x.jpg"));
    // Explicit host wins.
    process.env.TIKTOK_MEDIA_BLOB_HOST = "he4is6089cggjac5.public.blob.vercel-storage.com";
    assert.ok(isAllowedPhotoUrl("https://he4is6089cggjac5.public.blob.vercel-storage.com/uploads/a.jpg"));
    assert.ok(!isAllowedPhotoUrl("https://abc123.public.blob.vercel-storage.com/uploads/x.jpg"));
    assert.ok(!isAllowedPhotoUrl("https://he4is6089cggjac5.public.blob.vercel-storage.com.evil.example/x.jpg"));
  } finally {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
});

test("rateLimit allows up to the limit then blocks", () => {
  const key = "test-" + Math.floor(Math.random() * 1e9);
  for (let i = 0; i < 3; i++) assert.ok(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok);
  const blocked = rateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.ok(!blocked.ok);
  assert.ok(blocked.retryAfter > 0);
});
