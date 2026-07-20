import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import { stripJpegMetadata } from "@/lib/image";

// Photo upload. Persistence backend is chosen at runtime:
//   1. Cloudflare R2 (prod on CF) — via the OpenNext `UPLOADS_BUCKET` binding.
//   2. /public/uploads — local dev only (ephemeral on serverless hosts).
// The remote path validates real image bytes + size before storing.
// (The prior Vercel Blob backend was removed with the Vercel→Cloudflare port.)

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const MAX_FILES = 6;

// Verify real image bytes (magic numbers) rather than trusting filename/MIME.
function sniffExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "webp";
  return null;
}

async function storeLocal(bytes, fname) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fname), bytes);
  return `/uploads/${fname}`;
}

// Cloudflare R2 via the OpenNext runtime binding — no external SDK to bundle.
// Returns null (not throw) when not running on CF / no bucket bound, so callers
// can fall through to the next backend.
async function getR2Bucket() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx?.env?.UPLOADS_BUCKET ?? null;
  } catch {
    return null; // not on the Cloudflare runtime (e.g. local dev)
  }
}

async function storeR2(bucket, bytes, fname, contentType) {
  await bucket.put(`uploads/${fname}`, bytes, { httpMetadata: { contentType } });
  // Objects are served from the bucket's public base (R2 public dev URL or a
  // custom domain), configured via R2_PUBLIC_BASE_URL.
  const base = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return `${base}/uploads/${fname}`;
}

const MIME = { jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const limited = await enforceRateLimit(req, `upload:${user.id}`, { limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  // Reject an oversized multipart body BEFORE parsing it into memory (App Router
  // route handlers have no default body cap → memory-exhaustion DoS otherwise).
  const MAX_BODY = MAX_BYTES * MAX_FILES + 1024 * 1024; // total payload ceiling
  const declaredLen = Number(req.headers.get("content-length") || 0);
  if (declaredLen > MAX_BODY) {
    return NextResponse.json({ error: "Upload too large." }, { status: 413 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f) => typeof f === "object" && f.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "No files uploaded." }, { status: 400 });

  const r2 = await getR2Bucket();
  const urls = [];
  for (const file of files.slice(0, MAX_FILES)) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each image must be 8 MB or smaller." }, { status: 413 });
    }
    let bytes = Buffer.from(await file.arrayBuffer());
    const ext = sniffExt(bytes);
    if (!ext) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or WEBP images are allowed." }, { status: 415 });
    }
    // Remove Exif/GPS metadata from JPEGs so uploads don't leak location.
    if (ext === "jpg") bytes = stripJpegMetadata(bytes);
    const fname = `${user.id.slice(0, 6)}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    try {
      urls.push(r2 ? await storeR2(r2, bytes, fname, MIME[ext]) : await storeLocal(bytes, fname));
    } catch (e) {
      // If the R2 store isn't reachable/configured, fall back to local rather than 500.
      urls.push(await storeLocal(bytes, fname));
    }
  }

  return NextResponse.json({ ok: true, urls });
}
