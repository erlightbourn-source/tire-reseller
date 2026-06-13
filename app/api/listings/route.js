import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveSeller } from "@/lib/auth";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  if (!isActiveSeller(user)) {
    return NextResponse.json(
      { error: "An active seller subscription is required to create listings.", code: "subscription_required" },
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
      description: b.description || null,
      photos: {
        create: photos.map((url, i) => ({ url, sort: i })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
