import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingForm from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { sort: "asc" } } },
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
