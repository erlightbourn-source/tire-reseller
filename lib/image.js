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
