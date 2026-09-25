import { verifyMediaToken } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

const TYPES = { jpg: "image/jpeg", webp: "image/webp" };

// TikTok pulls post photos from here (PULL_FROM_URL needs a domain we've verified).
// <file> = <signed token>.<ext>. The token is short-lived and can only point at our
// own photo storage, so this can't be used as an open proxy.
export async function GET(_req, { params }) {
  const { file } = await params;
  const m = /^(.+)\.(jpg|webp)$/.exec(String(file || ""));
  if (!m) return new Response("Not found", { status: 404 });
  const src = await verifyMediaToken(m[1]);
  if (!src) return new Response("Not found", { status: 404 });

  const up = await fetch(src, { cache: "no-store", redirect: "error" }).catch(() => null);
  if (!up || !up.ok || !up.body) return new Response("Not found", { status: 404 });

  return new Response(up.body, {
    status: 200,
    headers: {
      "Content-Type": TYPES[m[2]],
      ...(up.headers.get("content-length") ? { "Content-Length": up.headers.get("content-length") } : {}),
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
