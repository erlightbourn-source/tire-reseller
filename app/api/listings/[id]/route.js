import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";
import { resolveState } from "@/lib/states";
import { geocodeCity } from "@/lib/geo";
import { cleanStr, clampInt, ValidationError, LIMITS, isAllowedPhotoUrl, enforceRateLimit } from "@/lib/security";
import { deriveListingColumns } from "@/lib/tiresize";
import { stripDataUriMetadata } from "@/lib/image";
import { normalizeSpeedRating, parseDotYear } from "@/lib/listingProof";

const SEASONS = ["summer", "winter", "all-season", "all-weather"];

async function requireOwner(req, id) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not logged in." }, { status: 401 }) };
  // Edits re-geocode, rewrite photo rows (each up to a 2 MB data URI) and delete —
  // throttle per account like listing creation is.
  const limited = await enforceRateLimit(req, "listing-edit", { key: user.id, limit: 30, windowMs: 60_000 });
  if (limited) return { error: limited };
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return { error: NextResponse.json({ error: "Listing not found." }, { status: 404 }) };
  if (listing.sellerId !== user.id)
    return { error: NextResponse.json({ error: "Not your listing." }, { status: 403 }) };
  return { user, listing };
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { error, listing, user } = await requireOwner(req, id);
  if (error) return error;

  const b = await req.json();
  const data = {};
  try {
    if (b.brand !== undefined) data.brand = cleanStr(b.brand, LIMITS.brand, { required: true, field: "Brand" });
    if (b.size !== undefined) data.size = cleanStr(b.size, LIMITS.size, { required: true, field: "Size" });
    if (b.treadDepth !== undefined) data.treadDepth = cleanStr(b.treadDepth, LIMITS.treadDepth, { field: "Tread depth" });
    if (b.description !== undefined) data.description = cleanStr(b.description, LIMITS.description, { field: "Description" });
    // Proof fields stay optional on edit (existing listings may predate the requirement),
    // but anything provided is validated rather than silently dropped.
    if (b.speedRating !== undefined) data.speedRating = normalizeSpeedRating(b.speedRating);
    if (b.dotYear !== undefined) data.dotYear = parseDotYear(b.dotYear);
    if (b.location !== undefined) {
      const loc = cleanStr(b.location, LIMITS.location, { required: true, field: "Location" });
      data.location = loc;
      const st = resolveState(b.state, loc);
      data.state = st;
      const coords = geocodeCity(loc, st) || {};
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
  if (b.status !== undefined && ["active", "sold"].includes(b.status)) {
    // An expired seller can still edit, mark sold or delete, but can't put a
    // listing back on the market without an active plan (audit L1624 F14);
    // creating listings is gated the same way in POST /api/listings.
    if (b.status === "active" && listing.status !== "active" && !canSell(user)) {
      return NextResponse.json(
        { error: "Your listing period has ended. Subscribe to relist.", code: "subscription_required" },
        { status: 403 }
      );
    }
    data.status = b.status;
  }
  // NOTE: `featured` (paid/admin promotion) is intentionally NOT accepted here —
  // allowing the owner to set it would let any seller promote a listing for free.
  if (b.season !== undefined) data.season = SEASONS.includes(b.season) ? b.season : null;
  if (b.loadIndex !== undefined) data.loadIndex = b.loadIndex ? String(b.loadIndex).trim().slice(0, 8) : null;
  if (b.runFlat !== undefined) data.runFlat = !!b.runFlat;
  if (b.shipping !== undefined) data.shipping = !!b.shipping;

  // Keep the denormalized size/tread/per-tire columns in sync when any of their
  // inputs change (merge new values with the existing row).
  if (data.size !== undefined || data.treadDepth !== undefined || data.priceCents !== undefined || data.quantity !== undefined) {
    Object.assign(data, deriveListingColumns({
      size: data.size ?? listing.size,
      treadDepth: data.treadDepth ?? listing.treadDepth,
      priceCents: data.priceCents ?? listing.priceCents,
      quantity: data.quantity ?? listing.quantity,
    }));
  }

  // Replace photos if provided — only host-served or data-URI images. Data-URI
  // photos bypass the /api/upload Exif-stripping pipeline, so strip them here too.
  if (Array.isArray(b.photos)) {
    const photos = b.photos.filter(isAllowedPhotoUrl).slice(0, 6).map(stripDataUriMetadata);
    const dropped = b.photos.filter((u) => !isAllowedPhotoUrl(u)).length;
    // A drop here deletes a seller's photo on save; if it ever happens to our own
    // store's URLs (blob host env drift), this line is the only trace.
    if (dropped > 0) console.warn("listing edit: dropped disallowed photo URLs", { listingId: listing.id, dropped });
    // Delete + re-create inside the SAME update (one nested write = one
    // transaction). A separate deleteMany ran first and committed on its own, so
    // any failure in the update below left the listing with zero photos.
    data.photos = { deleteMany: {}, create: photos.map((url, i) => ({ url, sort: i })) };
  }

  await prisma.listing.update({ where: { id: listing.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const { error, listing } = await requireOwner(req, id);
  if (error) return error;
  await prisma.listing.delete({ where: { id: listing.id } });
  return NextResponse.json({ ok: true });
}
