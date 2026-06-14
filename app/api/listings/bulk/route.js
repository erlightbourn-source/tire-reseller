import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";
import { stateFromLocation } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";

// Pro-only bulk add. One listing per line:
//   Brand | Size | Price | Qty | new/used | City, ST
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!canSell(user)) return NextResponse.json({ error: "Become a seller first." }, { status: 402 });
  if (!user.pro) return NextResponse.json({ error: "Bulk add is a Pro feature.", code: "pro_required" }, { status: 402 });

  const { text } = await req.json();
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return NextResponse.json({ error: "Nothing to add." }, { status: 400 });

  const created = [];
  const errors = [];
  for (let i = 0; i < lines.length && created.length < 50; i++) {
    const parts = lines[i].split("|").map((p) => p.trim());
    const [brand, size, price, qty, cond, location] = parts;
    if (!brand || !size || !price || !location) {
      errors.push(`Line ${i + 1}: need at least Brand | Size | Price | … | City, ST`);
      continue;
    }
    const coords = geocodeCity(location) || {};
    const l = await prisma.listing.create({
      data: {
        sellerId: user.id,
        brand,
        size,
        quantity: Math.max(1, parseInt(qty) || 4),
        condition: cond === "new" ? "new" : "used",
        priceCents: Math.round(Number(price) * 100) || 0,
        location,
        state: stateFromLocation(location),
        lat: coords.lat ?? null,
        lng: coords.lng ?? null,
      },
    });
    created.push(l.id);
  }
  return NextResponse.json({ ok: true, count: created.length, errors });
}
