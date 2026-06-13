import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

// Local-disk photo upload for the MVP. Files are written to /public/uploads
// and served statically. Swap for S3 / Cloudinary in production.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f) => typeof f === "object" && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const urls = [];
  for (const file of files.slice(0, 6)) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const fname = `${user.id.slice(0, 6)}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${safeExt}`;
    await writeFile(path.join(dir, fname), bytes);
    urls.push(`/uploads/${fname}`);
  }

  return NextResponse.json({ ok: true, urls });
}
