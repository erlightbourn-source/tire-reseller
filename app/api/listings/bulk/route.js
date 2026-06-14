import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";
import { stateFromLocation } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";
import { enforceRateLimit, cleanStr, clampInt, ValidationError, LIMITS } from "@/lib/security";

const MAX_LINES = 50;

// Pro-only bulk add. One listing per line:
//   Brand | Size | Price | Qty | new/used | City, ST
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!canSell(user)) return NextResponse.json({ error: "Become a seller first." }, { status: 402 });
  if (!user.pro) return NextResponse.json({ error: "Bulk add is a Pro feature.", code: "pro_required" }, { status: 402 });

  const limited = enforceRateLimit(req, `bulk:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const raw = await req.json();
  const lines = String(raw?.text || "").slice(0, 20_000).split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return NextResponse.json({ error: "Nothing to add." }, { status: 400 });

  const created = [];
  const errors = [];
  for (let i = 0; i < lines.length && created.length < MAX_LINES; i++) {
    const parts = lines[i].split("|").map((p) => p.trim());
    const [brandRaw, sizeRaw, priceRaw, qtyRaw, condRaw, locationRaw] = parts;
    try {
      const brand = cleanStr(brandRaw, LIMITS.brand, { required: true, field: "Brand" });
      const size = cleanStr(sizeRaw, LIMITS.size, { required: true, field: "Size" });
      const location = cleanStr(locationRaw, LIMITS.location, { required: true, field: "City, ST" });
      const price = Number(priceRaw);
      if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
        errors.push(`Line ${i + 1}: invalid price`);
        continue;
      }
      const coords = geocodeCity(location) || {};
      const l = await prisma.listing.create({
        data: {
          sellerId: user.id,
          brand,
          size,
          quantity: clampInt(qtyRaw, { min: 1, max: 100, fallback: 4 }),
          condition: condRaw === "new" ? "new" : "used",
          priceCents: Math.round(price * 100),
          location,
          state: stateFromLocation(location),
          lat: coords.lat ?? null,
          lng: coords.lng ?? null,
        },
      });
      created.push(l.id);
    } catch (e) {
      if (e instanceof ValidationError) { errors.push(`Line ${i + 1}: ${e.message}`); continue; }
      throw e;
    }
  }
  if (lines.length > MAX_LINES) errors.push(`Only the first ${MAX_LINES} lines were processed.`);
  return NextResponse.json({ ok: true, count: created.length, errors });
}
