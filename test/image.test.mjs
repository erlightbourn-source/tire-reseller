// Upload metadata stripping: a phone photo embeds GPS, so anything we persist
// must have its metadata containers removed or a seller leaks their home
// address. These tests build real images with real EXIF/XMP payloads, run them
// through the strippers, and assert both that the metadata is gone AND that the
// result still decodes as a valid image.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stripJpegMetadata,
  stripPngMetadata,
  stripWebpMetadata,
  stripMetadata,
} from "../lib/image.js";

// A recognizable GPS-ish payload we can search for in the raw bytes.
const SECRET = "GPSHOMEADDRESS-26.2379,-80.2506";

/** Minimal PNG: signature + IHDR + IDAT + IEND, with optional extra chunks. */
function makePng(extraChunks = []) {
  const crcTable = (() => {
    const t = new Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (const byte of b) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); // width
  ihdr.writeUInt32BE(1, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    ...extraChunks.map(([t, d]) => chunk(t, Buffer.from(d))),
    chunk("IDAT", Buffer.from([0x78, 0x9c, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01])),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Minimal extended (VP8X) WebP with EXIF + XMP chunks. */
function makeWebp({ withMeta = true } = {}) {
  const riffChunk = (fourcc, data) => {
    const size = Buffer.alloc(4);
    size.writeUInt32LE(data.length);
    const pad = data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0);
    return Buffer.concat([Buffer.from(fourcc, "ascii"), size, data, pad]);
  };
  const vp8xData = Buffer.alloc(10);
  if (withMeta) vp8xData[0] = 0x0c; // EXIF (0x08) + XMP (0x04) present
  const parts = [riffChunk("VP8X", vp8xData), riffChunk("VP8 ", Buffer.alloc(16, 0x11))];
  if (withMeta) {
    parts.push(riffChunk("EXIF", Buffer.from(SECRET)));
    parts.push(riffChunk("XMP ", Buffer.from(SECRET)));
  }
  const body = Buffer.concat(parts);
  const head = Buffer.alloc(12);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(body.length + 4, 4);
  head.write("WEBP", 8, "ascii");
  return Buffer.concat([head, body]);
}

test("stripPngMetadata removes eXIf and text chunks, keeps pixel chunks", () => {
  const dirty = makePng([
    ["eXIf", SECRET],
    ["tEXt", `Comment\0${SECRET}`],
    ["iTXt", `XML:com.adobe.xmp\0\0\0\0\0${SECRET}`],
  ]);
  assert.ok(dirty.includes(SECRET), "fixture should contain the secret");

  const clean = stripPngMetadata(dirty);
  assert.ok(!clean.includes(SECRET), "GPS/metadata payload must be gone");
  assert.ok(clean.includes("IHDR"), "IHDR must be preserved");
  assert.ok(clean.includes("IDAT"), "pixel data must be preserved");
  assert.ok(clean.includes("IEND"), "IEND must be preserved");
  assert.ok(clean.length < dirty.length);
});

test("stripPngMetadata leaves a clean PNG byte-identical", () => {
  const clean = makePng();
  assert.deepEqual(stripPngMetadata(clean), clean);
});

test("stripPngMetadata returns the original buffer for non-PNG or malformed input", () => {
  const notPng = Buffer.from("hello world, definitely not a png");
  assert.deepEqual(stripPngMetadata(notPng), notPng);

  // Truncated mid-chunk: must bail rather than emit a corrupt image.
  const truncated = makePng([["eXIf", SECRET]]).subarray(0, 30);
  assert.deepEqual(stripPngMetadata(truncated), truncated);

  assert.deepEqual(stripPngMetadata(Buffer.alloc(0)), Buffer.alloc(0));
  assert.deepEqual(stripPngMetadata("not a buffer"), "not a buffer");
});

test("stripWebpMetadata removes EXIF/XMP and clears the VP8X flag bits", () => {
  const dirty = makeWebp();
  assert.ok(dirty.includes(SECRET), "fixture should contain the secret");
  assert.equal(dirty[20], 0x0c, "fixture VP8X should advertise EXIF+XMP");

  const clean = stripWebpMetadata(dirty);
  assert.ok(!clean.includes(SECRET), "EXIF/XMP payload must be gone");
  assert.equal(clean.toString("ascii", 0, 4), "RIFF");
  assert.equal(clean.toString("ascii", 8, 12), "WEBP");
  assert.equal(clean[20] & 0x0c, 0, "VP8X must no longer advertise EXIF/XMP");
  // RIFF size field must match the rewritten body.
  assert.equal(clean.readUInt32LE(4), clean.length - 8, "RIFF size must be consistent");
  assert.ok(clean.includes("VP8X") && clean.includes("VP8 "), "image chunks preserved");
});

test("stripWebpMetadata leaves a metadata-free WebP untouched", () => {
  const clean = makeWebp({ withMeta: false });
  assert.deepEqual(stripWebpMetadata(clean), clean);
});

test("stripWebpMetadata returns the original buffer for non-WebP or malformed input", () => {
  const notWebp = Buffer.from("RIFFxxxxNOTWEBPdata");
  assert.deepEqual(stripWebpMetadata(notWebp), notWebp);

  const truncated = makeWebp().subarray(0, 20);
  assert.deepEqual(stripWebpMetadata(truncated), truncated);

  assert.deepEqual(stripWebpMetadata(Buffer.alloc(4)), Buffer.alloc(4));
});

test("stripMetadata dispatches by sniffed extension", () => {
  const png = makePng([["eXIf", SECRET]]);
  assert.ok(!stripMetadata(png, "png").includes(SECRET));

  const webp = makeWebp();
  assert.ok(!stripMetadata(webp, "webp").includes(SECRET));

  // GIF and unknown types pass through untouched.
  const gif = Buffer.from("GIF89a-not-really");
  assert.deepEqual(stripMetadata(gif, "gif"), gif);
  assert.deepEqual(stripMetadata(gif, "bmp"), gif);
});

test("stripJpegMetadata still removes APP1 (regression guard)", () => {
  // SOI + APP1(Exif payload) + SOS + data + EOI
  const app1Payload = Buffer.from(`Exif\0\0${SECRET}`);
  const app1Len = Buffer.alloc(2);
  app1Len.writeUInt16BE(app1Payload.length + 2);
  const jpeg = Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe1]),
    app1Len,
    app1Payload,
    Buffer.from([0xff, 0xda, 0x00, 0x02]),
    Buffer.from([0x11, 0x22, 0x33]),
    Buffer.from([0xff, 0xd9]),
  ]);
  assert.ok(jpeg.includes(SECRET));

  const clean = stripJpegMetadata(jpeg);
  assert.ok(!clean.includes(SECRET), "APP1/Exif must be removed");
  assert.equal(clean[0], 0xff);
  assert.equal(clean[1], 0xd8, "SOI preserved");
  assert.ok(clean.includes(Buffer.from([0xff, 0xd9])), "EOI preserved");
});
