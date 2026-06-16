import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { stateFromLocation } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";
import { cleanStr, clampInt, ValidationError, LIMITS, isAllowedPhotoUrl } from "@/lib/security";

const SEASONS = ["summer", "winter", "all-season", "all-weather"];

async function requireOwner(id) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not logged in." }, { status: 401 }) };
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return { error: NextResponse.json({ error: "Listing not found." }, { status: 404 }) };
  if (listing.sellerId !== user.id)
    return { error: NextResponse.json({ error: "Not your listing." }, { status: 403 }) };
  return { user, listing };
}

export async function PATCH(req, { params }) {
  const { error, listing } = await requireOwner(params.id);
  if (error) return error;

  const b = await req.json();
  const data = {};
  try {
    if (b.brand !== undefined) data.brand = cleanStr(b.brand, LIMITS.brand, { required: true, field: "Brand" });
    if (b.size !== undefined) data.size = cleanStr(b.size, LIMITS.size, { required: true, field: "Size" });
    if (b.treadDepth !== undefined) data.treadDepth = cleanStr(b.treadDepth, LIMITS.treadDepth, { field: "Tread depth" });
    if (b.description !== undefined) data.description = cleanStr(b.description, LIMITS.description, { field: "Description" });
    if (b.location !== undefined) {
      const loc = cleanStr(b.location, LIMITS.location, { required: true, field: "Location" });
      data.location = loc;
      data.state = stateFromLocation(loc);
      const coords = geocodeCity(loc) || {};
      data.lat = coords.lat ?? null;
      data.lng = coords.lng ?? null;
    }
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  if (b.quantity !== undefined) data.quantity = clampInt(b.quantity, { min: 1, max: 100, fallback: 1 });
  if (b.condition !== undefined) data.condition = b.condition === "new" ? "new" : "used";
  if (b.price !== undefined) {
    const price = Number(b.price);
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000)
      return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
    data.priceCents = Math.round(price * 100);
  }
  if (b.status !== undefined && ["active", "sold"].includes(b.status)) data.status = b.status;
  // NOTE: `featured` (paid/admin promotion) is intentionally NOT accepted here —
  // allowing the owner to set it would let any seller promote a listing for free.
  if (b.season !== undefined) data.season = SEASONS.includes(b.season) ? b.season : null;
  if (b.loadIndex !== undefined) data.loadIndex = b.loadIndex ? String(b.loadIndex).trim().slice(0, 8) : null;
  if (b.speedRating !== undefined) data.speedRating = b.speedRating ? String(b.speedRating).trim().toUpperCase().slice(0, 4) : null;
  if (b.runFlat !== undefined) data.runFlat = !!b.runFlat;
  if (b.dotYear !== undefined) {
    const dot = b.dotYear && Number(b.dotYear) ? Math.round(Number(b.dotYear)) : null;
    data.dotYear = dot && dot >= 1990 && dot <= 2100 ? dot : null;
  }
  if (b.shipping !== undefined) data.shipping = !!b.shipping;

  // Replace photos if provided — only host-served or data-URI images.
  if (Array.isArray(b.photos)) {
    await prisma.photo.deleteMany({ where: { listingId: listing.id } });
    const photos = b.photos.filter(isAllowedPhotoUrl).slice(0, 6);
    data.photos = { create: photos.map((url, i) => ({ url, sort: i })) };
  }

  await prisma.listing.update({ where: { id: listing.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { error, listing } = await requireOwner(params.id);
  if (error) return error;
  await prisma.listing.delete({ where: { id: listing.id } });
  return NextResponse.json({ ok: true });
}
