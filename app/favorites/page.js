import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/favorites");

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { photos: { take: 1, orderBy: { sort: "asc" } } } } },
  });
  const listings = favs.map((f) => f.listing).filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Watchlist</p>
        <h1 className="font-display text-2xl font-extrabold text-white">Saved tires</h1>
        <p className="text-sm text-slate-400">{listings.length} saved listing{listings.length !== 1 ? "s" : ""}</p>
      </div>

      {listings.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <span className="text-4xl">🤍</span>
          <p className="mt-3 font-display text-lg font-bold text-slate-200">No saved tires yet</p>
          <p className="mt-1 text-sm text-slate-400">Tap the heart on any listing to save it here.</p>
          <Link href="/browse" className="btn-secondary mt-4">Browse tires</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} favorited />
          ))}
        </div>
      )}
    </div>
  );
}
