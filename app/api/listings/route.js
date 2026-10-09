import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell, sellerStatus } from "@/lib/auth";
import { resolveState } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";
import { deriveListingColumns } from "@/lib/tiresize";
import { isProSeller } from "@/lib/seller";
import { enforceRateLimit, cleanStr, clampInt, ValidationError, LIMITS, isAllowedPhotoUrl } from "@/lib/security";
import { priceFor, PLAN_COPY } from "@/lib/pricing";
import { stripDataUriMetadata } from "@/lib/image";
import { normalizeSpeedRating, parseDotYear, requireTreadDepth } from "@/lib/listingProof";

const SEASONS = ["summer", "winter", "all-season", "all-weather"];
// speedRating and dotYear are validated by the caller (a bad value is a 400, never silently dropped).
function tireAttrs(b, state, { speedRating, dotYear }) {
  const coords = geocodeCity(b.location, state) || {};
  return {
    season: SEASONS.includes(b.season) ? b.season : null,
    loadIndex: b.loadIndex ? String(b.loadIndex).trim().slice(0, 8) : null,
    speedRating,
    runFlat: !!b.runFlat,
    shipping: !!b.shipping,
    dotYear,
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
          ? `Your launch listing period has ended. Subscribe for ${priceFor(user).label} to keep listing.`
          : `Create a seller account to list tires. ${PLAN_COPY.launchFree}`,
        code: expired ? "subscription_required" : "become_seller",
      },
      { status: 402 }
    );
  }

  const limited = await enforceRateLimit(req, "listing", { key: user.id, limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const b = await req.json();
  let brand, size, location, treadDepth, description, dotYear, speedRating;
  try {
    brand = cleanStr(b.brand, LIMITS.brand, { required: true, field: "Brand" });
    size = cleanStr(b.size, LIMITS.size, { required: true, field: "Size" });
    location = cleanStr(b.location, LIMITS.location, { required: true, field: "Location" });
    // Proof fields: required on new listings so buyers can vet before messaging.
    treadDepth = requireTreadDepth(b.treadDepth);
    dotYear = parseDotYear(b.dotYear, { required: true });
    speedRating = normalizeSpeedRating(b.speedRating);
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
  // Data-URI photos bypass the /api/upload Exif-stripping pipeline, so strip them here too
  // (a raw phone-camera data URI can otherwise leak the seller's GPS location verbatim).
  const photos = (Array.isArray(b.photos) ? b.photos : [])
    .filter(isAllowedPhotoUrl)
    .slice(0, 6)
    .map(stripDataUriMetadata);

  const quantity = clampInt(b.quantity, { min: 1, max: 100, fallback: 1 });
  const priceCents = Math.round(price * 100);
  const state = resolveState(b.state, location);
  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      brand,
      size,
      quantity,
      condition: b.condition === "new" ? "new" : "used",
      treadDepth,
      priceCents,
      location,
      state,
      description,
      sellerPro: isProSeller(user),
      sellerFounding: !!user.foundingSeller,
      ...deriveListingColumns({ size, treadDepth, priceCents, quantity }),
      ...tireAttrs(b, state, { speedRating, dotYear }),
      photos: {
        create: photos.map((url, i) => ({ url, sort: i })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
