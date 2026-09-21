import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanStr,
  clampInt,
  isEmail,
  ValidationError,
  rateLimit,
  isAllowedPhotoUrl,
  sanitizePhotoUrl,
} from "../lib/validation.js";

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
  assert.ok(isAllowedPhotoUrl("https://abc123.public.blob.vercel-storage.com/uploads/x.jpg"));
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

// Minimal real JPEG (SOI + APP1/Exif carrying a GPS-ish secret + SOS + EOI),
// same construction as test/image.test.mjs's APP1 regression test.
function makeJpegWithSecret(secret) {
  const app1Payload = Buffer.from(`Exif\0\0${secret}`);
  const app1Len = Buffer.alloc(2);
  app1Len.writeUInt16BE(app1Payload.length + 2);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe1]),
    app1Len,
    app1Payload,
    Buffer.from([0xff, 0xda, 0x00, 0x02]),
    Buffer.from([0x11, 0x22, 0x33]),
    Buffer.from([0xff, 0xd9]),
  ]);
}

test("sanitizePhotoUrl strips embedded GPS/Exif from an inline data-URI photo", () => {
  const secret = "GPSHOMEADDRESS-26.2379,-80.2506";
  const jpeg = makeJpegWithSecret(secret);
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  const cleaned = sanitizePhotoUrl(dataUrl);

  assert.match(cleaned, /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/);
  const decoded = Buffer.from(cleaned.split(",")[1], "base64");
  assert.ok(!decoded.includes(secret), "Exif payload (and its embedded GPS secret) must be stripped");
  // Still a decodable JPEG: SOI header intact.
  assert.equal(decoded[0], 0xff);
  assert.equal(decoded[1], 0xd8);
});

test("sanitizePhotoUrl leaves non-data-URI photo URLs untouched (already stripped at upload)", () => {
  assert.equal(sanitizePhotoUrl("/uploads/abc.jpg"), "/uploads/abc.jpg");
  assert.equal(
    sanitizePhotoUrl("https://pub-abc123.r2.dev/uploads/x.jpg"),
    "https://pub-abc123.r2.dev/uploads/x.jpg"
  );
  assert.equal(sanitizePhotoUrl(42), 42);
});

test("rateLimit allows up to the limit then blocks", () => {
  const key = "test-" + Math.floor(Math.random() * 1e9);
  for (let i = 0; i < 3; i++) assert.ok(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok);
  const blocked = rateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.ok(!blocked.ok);
  assert.ok(blocked.retryAfter > 0);
});
