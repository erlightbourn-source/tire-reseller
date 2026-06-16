import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingForm from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Scope the query to just what the (client) form needs — don't serialize the
  // listing's lat/lng or internal flags (views/hidden/featured) into the page.
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true, sellerId: true, brand: true, size: true, quantity: true, condition: true,
      treadDepth: true, priceCents: true, location: true, description: true, season: true,
      loadIndex: true, speedRating: true, runFlat: true, shipping: true, dotYear: true, status: true,
      photos: { orderBy: { sort: "asc" } },
    },
  });
  if (!listing) notFound();
  if (listing.sellerId !== user.id) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold">Edit listing</h1>
      <div className="card p-6">
        <ListingForm initial={listing} />
      </div>
    </div>
  );
}
