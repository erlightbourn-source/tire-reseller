import { test } from "node:test";
import assert from "node:assert/strict";
import { detectOffPlatform } from "../lib/safety.js";
import { stripJpegMetadata } from "../lib/image.js";

test("detectOffPlatform flags contact info and payment apps", () => {
  assert.ok(detectOffPlatform("call me at 555-123-4567").flagged);
  assert.ok(detectOffPlatform("email me joe@example.com").flagged);
  assert.ok(detectOffPlatform("pay by Venmo").flagged);
  assert.ok(detectOffPlatform("let's move to WhatsApp").flagged);
  assert.ok(detectOffPlatform("Zelle only, no meetups").reasons.includes("payment"));
});

test("detectOffPlatform passes normal messages", () => {
  assert.ok(!detectOffPlatform("Are these still available? Can I see them Saturday?").flagged);
  assert.ok(!detectOffPlatform("").flagged);
});

test("detectOffPlatform reports each off-platform signal independently", () => {
  // MessageSeller reads `.flagged` and each reason; lock the reason vocabulary
  // so a refactor can't silently drop a detector the composer warning depends on.
  assert.ok(detectOffPlatform("here is 5551234567").reasons.includes("phone"));
  assert.ok(detectOffPlatform("a@b.co is best").reasons.includes("email"));
  assert.ok(detectOffPlatform("only cashapp works").reasons.includes("payment"));
  assert.ok(detectOffPlatform("let's use telegram").reasons.includes("contact"));
});

test("detectOffPlatform ignores content past the 4000-char input cap", () => {
  // lib/safety.js slices callers' text to 4000 chars to bound per-call regex
  // cost. A signal buried past the cap must not be scanned; one inside it must.
  const buried = " ".repeat(4001) + "555-123-4567";
  assert.ok(!detectOffPlatform(buried).flagged, "signal past the cap should be ignored");
  assert.ok(detectOffPlatform("555-123-4567").flagged, "same signal within the cap is flagged");
});

test("detectOffPlatform stays fast on adversarial long input (ReDoS guard)", () => {
  // EMAIL_RE was hardened from an unbounded form that backtracked quadratically
  // (~70ms at 4k chars) to a bounded, linear form. Guard the fix: a 16k-char
  // no-`@` run must return well under a generous bound, not hang the composer.
  const hostile = "a".repeat(16000);
  const start = performance.now();
  const out = detectOffPlatform(hostile);
  const elapsed = performance.now() - start;
  assert.ok(!out.flagged);
  assert.ok(elapsed < 100, `detectOffPlatform took ${elapsed.toFixed(1)}ms — expected < 100ms (ReDoS regression?)`);
});

test("stripJpegMetadata removes APP1/Exif and keeps a valid JPEG", () => {
  const app1Payload = Buffer.concat([Buffer.from("Exif\0\0"), Buffer.from([1, 2, 3, 4])]); // 10 bytes
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 0x0c]), app1Payload]);
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x03, 0x00]); // SOS + tiny header
  const scan = Buffer.from([0x12, 0x34]);
  const eoi = Buffer.from([0xff, 0xd9]);
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), app1, sos, scan, eoi]);

  const out = stripJpegMetadata(jpeg);
  assert.equal(out[0], 0xff);
  assert.equal(out[1], 0xd8); // still starts with SOI
  assert.ok(!out.includes(Buffer.from("Exif"))); // metadata gone
  assert.ok(out.length < jpeg.length);
});

test("stripJpegMetadata leaves non-JPEG buffers untouched", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  assert.deepEqual(stripJpegMetadata(png), png);
});
