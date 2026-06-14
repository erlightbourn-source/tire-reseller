import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";

// Local-disk photo upload for the MVP. Files are written to /public/uploads
// and served statically. Swap for S3 / Cloudinary in production.

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const MAX_FILES = 6;

// Verify real image bytes (magic numbers) rather than trusting the filename or
// the client-supplied content-type — stops disguised executables/SVGs.
function sniffExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  // WEBP: "RIFF"...."WEBP"
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "webp";
  return null;
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const limited = enforceRateLimit(req, `upload:${user.id}`, { limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  const form = await req.formData();
  const files = form.getAll("files").filter((f) => typeof f === "object" && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const urls = [];
  for (const file of files.slice(0, MAX_FILES)) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each image must be 8 MB or smaller." }, { status: 413 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = sniffExt(bytes);
    if (!ext) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or WEBP images are allowed." }, { status: 415 });
    }
    const fname = `${user.id.slice(0, 6)}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    await writeFile(path.join(dir, fname), bytes);
    urls.push(`/uploads/${fname}`);
  }

  return NextResponse.json({ ok: true, urls });
}
