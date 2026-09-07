// Strip metadata segments from JPEGs (APP1 = Exif/XMP, which carry GPS location,
// plus APP13 = IPTC/Photoshop). Phone photos are JPEG and embed GPS, so uploads
// can leak a seller's home address — this removes that. Conservative: if the
// bytes don't parse cleanly as JPEG, the original buffer is returned unchanged
// (never corrupt a valid image).
export function stripJpegMetadata(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return buf;
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return buf; // not a JPEG (no SOI)

  const out = [buf.subarray(0, 2)]; // keep SOI
  let i = 2;
  try {
    while (i < buf.length) {
      if (buf[i] !== 0xff) return buf; // expected a marker — bail safely
      const marker = buf[i + 1];

      // Start of scan: copy the rest verbatim (compressed image data follows).
      if (marker === 0xda) {
        out.push(buf.subarray(i));
        break;
      }
      // Standalone markers (no length): RSTn, SOI, EOI, TEM.
      if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        out.push(buf.subarray(i, i + 2));
        i += 2;
        continue;
      }

      const len = buf.readUInt16BE(i + 2); // segment length incl. these 2 bytes
      if (len < 2 || i + 2 + len > buf.length) return buf; // malformed — bail
      const isMeta = marker === 0xe1 || marker === 0xed; // APP1 (Exif/XMP), APP13 (IPTC)
      if (!isMeta) out.push(buf.subarray(i, i + 2 + len));
      i += 2 + len;
    }
  } catch {
    return buf;
  }
  return Buffer.concat(out);
}

// PNG chunks that carry metadata rather than pixels. eXIf is the one that holds
// GPS; the text chunks (tEXt/zTXt/iTXt) routinely carry camera software strings
// and XMP packets, which can also embed location.
const PNG_META_CHUNKS = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Strip metadata chunks from a PNG. Same contract as stripJpegMetadata: if the
 * bytes don't parse cleanly, return the original buffer untouched rather than
 * risk corrupting a valid image.
 */
export function stripPngMetadata(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8) return buf;
  if (!buf.subarray(0, 8).equals(PNG_SIG)) return buf;

  const out = [PNG_SIG];
  let i = 8;
  let sawEnd = false;
  try {
    while (i < buf.length) {
      if (i + 8 > buf.length) return buf; // truncated header — bail
      const len = buf.readUInt32BE(i);
      const type = buf.toString("ascii", i + 4, i + 8);
      const total = 12 + len; // length + type + data + CRC
      if (len > 0x7fffffff || i + total > buf.length) return buf; // malformed — bail

      if (!PNG_META_CHUNKS.has(type)) out.push(buf.subarray(i, i + total));
      i += total;

      if (type === "IEND") {
        sawEnd = true;
        break;
      }
    }
  } catch {
    return buf;
  }
  if (!sawEnd) return buf; // never found IEND — don't trust our parse
  return Buffer.concat(out);
}

/**
 * Strip EXIF/XMP chunks from an extended (VP8X) WebP. Also clears the matching
 * flag bits in the VP8X header so the container stays self-consistent. Simple
 * (non-VP8X) WebPs carry no metadata and are returned unchanged. Same
 * conservative contract: any parse anomaly returns the original buffer.
 */
export function stripWebpMetadata(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return buf;
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return buf;

  const declared = buf.readUInt32LE(4); // bytes after this field
  if (declared + 8 > buf.length) return buf; // truncated — bail

  const chunks = [];
  let i = 12;
  let removed = false;
  try {
    while (i < declared + 8) {
      if (i + 8 > buf.length) return buf;
      const fourcc = buf.toString("ascii", i, i + 4);
      const size = buf.readUInt32LE(i + 4);
      const padded = size + (size % 2); // chunks are padded to an even length
      if (size > 0x7fffffff || i + 8 + padded > buf.length) return buf;

      if (fourcc === "EXIF" || fourcc === "XMP ") {
        removed = true;
      } else {
        chunks.push(buf.subarray(i, i + 8 + padded));
      }
      i += 8 + padded;
    }
  } catch {
    return buf;
  }
  if (!removed) return buf; // nothing to strip — don't rewrite a clean file
  if (!chunks.length) return buf;

  // Clear the EXIF (0x08) and XMP (0x04) presence bits in the VP8X flags byte,
  // otherwise decoders are told to expect chunks we just removed.
  if (chunks[0].toString("ascii", 0, 4) === "VP8X" && chunks[0].length >= 9) {
    const vp8x = Buffer.from(chunks[0]); // copy: never mutate the caller's buffer
    vp8x[8] &= ~0x0c;
    chunks[0] = vp8x;
  }

  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(body.length + 4, 4); // "WEBP" + chunk bytes
  head.write("WEBP", 8, "ascii");
  return Buffer.concat([head, body]);
}

/** Dispatch to the right stripper for a sniffed extension. */
export function stripMetadata(buf, ext) {
  if (ext === "jpg") return stripJpegMetadata(buf);
  if (ext === "png") return stripPngMetadata(buf);
  if (ext === "webp") return stripWebpMetadata(buf);
  return buf; // gif: no EXIF container in practice
}
