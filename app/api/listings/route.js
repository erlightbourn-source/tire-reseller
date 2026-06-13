import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell, sellerStatus } from "@/lib/auth";
import { stateFromLocation } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";

const SEASONS = ["summer", "winter", "all-season", "all-weather"];
function tireAttrs(b) {
  const coords = geocodeCity(b.location) || {};
  return {
    season: SEASONS.includes(b.season) ? b.season : null,
    loadIndex: b.loadIndex ? String(b.loadIndex).trim() : null,
    speedRating: b.speedRating ? String(b.speedRating).trim().toUpperCase() : null,
    runFlat: !!b.runFlat,
    dotYear: b.dotYear && Number(b.dotYear) ? Math.round(Number(b.dotYear)) : null,
    lat: coords.lat ?? null,
    lng: coords.lng ?? null,
  };
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  if (!canSell(user)) {
    const expired = sellerStatus(user) === "expired";
    return NextResponse.json(
      {
        error: expired
          ? "Your free selling year has ended. Subscribe for $10/month to keep listing."
          : "Create a seller account to list tires — your first year is free.",
        code: expired ? "subscription_required" : "become_seller",
      },
      { status: 402 }
    );
  }

  const b = await req.json();
  const errors = [];
  if (!b.brand) errors.push("brand");
  if (!b.size) errors.push("size");
  if (!b.condition) errors.push("condition");
  if (!b.location) errors.push("location");
  if (b.price === undefined || b.price === "" || Number(b.price) <= 0) errors.push("price");
  if (errors.length) {
    return NextResponse.json({ error: `Missing/invalid fields: ${errors.join(", ")}` }, { status: 400 });
  }

  const photos = Array.isArray(b.photos) ? b.photos.filter(Boolean) : [];

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      brand: b.brand,
      size: b.size,
      quantity: Math.max(1, parseInt(b.quantity) || 1),
      condition: b.condition === "new" ? "new" : "used",
      treadDepth: b.treadDepth || null,
      priceCents: Math.round(Number(b.price) * 100),
      location: b.location,
      state: stateFromLocation(b.location),
      description: b.description || null,
      ...tireAttrs(b),
      photos: {
        create: photos.map((url, i) => ({ url, sort: i })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
