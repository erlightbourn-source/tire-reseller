import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell, sellerStatus } from "@/lib/auth";
import { stateFromLocation } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";
import { enforceRateLimit, cleanStr, clampInt, ValidationError, LIMITS, isAllowedPhotoUrl } from "@/lib/security";

const SEASONS = ["summer", "winter", "all-season", "all-weather"];
function tireAttrs(b) {
  const coords = geocodeCity(b.location) || {};
  const dot = b.dotYear && Number(b.dotYear) ? Math.round(Number(b.dotYear)) : null;
  return {
    season: SEASONS.includes(b.season) ? b.season : null,
    loadIndex: b.loadIndex ? String(b.loadIndex).trim().slice(0, 8) : null,
    speedRating: b.speedRating ? String(b.speedRating).trim().toUpperCase().slice(0, 4) : null,
    runFlat: !!b.runFlat,
    shipping: !!b.shipping,
    dotYear: dot && dot >= 1990 && dot <= 2100 ? dot : null,
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

  const limited = await enforceRateLimit(req, `listing:${user.id}`, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const b = await req.json();
  let brand, size, location, treadDepth, description;
  try {
    brand = cleanStr(b.brand, LIMITS.brand, { required: true, field: "Brand" });
    size = cleanStr(b.size, LIMITS.size, { required: true, field: "Size" });
    location = cleanStr(b.location, LIMITS.location, { required: true, field: "Location" });
    treadDepth = cleanStr(b.treadDepth, LIMITS.treadDepth, { field: "Tread depth" });
    description = cleanStr(b.description, LIMITS.description, { field: "Description" });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  if (!b.condition) return NextResponse.json({ error: "Missing/invalid fields: condition" }, { status: 400 });
  const price = Number(b.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  // Accept only host-served / data / Vercel Blob image URLs; reject arbitrary remote URLs.
  const photos = (Array.isArray(b.photos) ? b.photos : []).filter(isAllowedPhotoUrl).slice(0, 6);

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      brand,
      size,
      quantity: clampInt(b.quantity, { min: 1, max: 100, fallback: 1 }),
      condition: b.condition === "new" ? "new" : "used",
      treadDepth,
      priceCents: Math.round(price * 100),
      location,
      state: stateFromLocation(location),
      description,
      ...tireAttrs(b),
      photos: {
        create: photos.map((url, i) => ({ url, sort: i })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
