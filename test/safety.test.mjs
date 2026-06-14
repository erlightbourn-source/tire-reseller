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
