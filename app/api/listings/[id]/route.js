import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { stateFromLocation } from "@/lib/states";

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
  if (b.brand !== undefined) data.brand = b.brand;
  if (b.size !== undefined) data.size = b.size;
  if (b.quantity !== undefined) data.quantity = Math.max(1, parseInt(b.quantity) || 1);
  if (b.condition !== undefined) data.condition = b.condition === "new" ? "new" : "used";
  if (b.treadDepth !== undefined) data.treadDepth = b.treadDepth || null;
  if (b.price !== undefined) data.priceCents = Math.round(Number(b.price) * 100);
  if (b.location !== undefined) {
    data.location = b.location;
    data.state = stateFromLocation(b.location);
  }
  if (b.description !== undefined) data.description = b.description || null;
  if (b.status !== undefined && ["active", "sold"].includes(b.status)) data.status = b.status;

  // Replace photos if provided
  if (Array.isArray(b.photos)) {
    await prisma.photo.deleteMany({ where: { listingId: listing.id } });
    data.photos = { create: b.photos.filter(Boolean).map((url, i) => ({ url, sort: i })) };
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
