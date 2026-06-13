import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";
import SearchFilters from "@/components/SearchFilters";
import { stateName, isStateAbbr } from "@/lib/states";
import { milesBetween } from "@/lib/geo";

export const dynamic = "force-dynamic";

async function getListings(sp) {
  const { q, brand, condition, size, maxPrice, sort, state, season, runFlat } = sp;

  const AND = [{ status: "active" }];
  if (state && isStateAbbr(state)) AND.push({ state: state.toUpperCase() });
  if (brand) AND.push({ brand });
  if (condition) AND.push({ condition });
  if (size) AND.push({ size: { contains: size } });
  if (season) AND.push({ season });
  if (runFlat === "1") AND.push({ runFlat: true });
  if (maxPrice) AND.push({ priceCents: { lte: Math.round(Number(maxPrice) * 100) } });
  if (q) {
    AND.push({
      OR: [
        { brand: { contains: q } },
        { size: { contains: q } },
        { location: { contains: q } },
        { description: { contains: q } },
      ],
    });
  }

  let orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
  if (sort === "price_asc") orderBy = [{ featured: "desc" }, { priceCents: "asc" }];
  if (sort === "price_desc") orderBy = [{ featured: "desc" }, { priceCents: "desc" }];

  let listings = await prisma.listing.findMany({
    where: { AND },
    orderBy,
    include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
  });

  // Radius filter (haversine) — applied in JS since SQLite has no geo functions.
  const lat = Number(sp.lat), lng = Number(sp.lng), radius = Number(sp.radius);
  if (sp.lat && sp.lng && radius) {
    listings = listings
      .map((l) => ({ l, d: milesBetween(lat, lng, l.lat, l.lng) }))
      .filter((x) => x.d <= radius)
      .sort((a, b) => (b.l.featured - a.l.featured) || (a.d - b.d))
      .map((x) => x.l);
  }
  return listings;
}

export default async function BrowsePage({ searchParams }) {
  const [listings, brandRows, user] = await Promise.all([
    getListings(searchParams),
    prisma.listing.findMany({
      where: { status: "active" },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    getCurrentUser(),
  ]);
  const brands = brandRows.map((b) => b.brand);

  let favSet = new Set();
  if (user && listings.length) {
    const favs = await prisma.favorite.findMany({
      where: { userId: user.id, listingId: { in: listings.map((l) => l.id) } },
      select: { listingId: true },
    });
    favSet = new Set(favs.map((f) => f.listingId));
  }

  const state = searchParams.state && isStateAbbr(searchParams.state) ? searchParams.state.toUpperCase() : null;
  const near = searchParams.near;
  const radius = searchParams.radius;
  const otherFilters = ["q", "brand", "condition", "size", "maxPrice", "sort", "season", "runFlat", "lat"].some(
    (k) => searchParams[k]
  );

  const scopeLabel = near && radius ? `Within ${radius} mi of ${near}` : state ? `Tires in ${stateName(state)}` : "All listings";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/states" className="hover:text-brand-300">Map</Link>
            <span>/</span>
            <span className="font-medium text-slate-200">{near && radius ? `Near ${near}` : state ? stateName(state) : "All states"}</span>
          </nav>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">{scopeLabel}</h1>
          <p className="text-sm text-slate-400">
            {listings.length} tire set{listings.length !== 1 ? "s" : ""}
            {otherFilters ? " match your filters" : " available"}
          </p>
        </div>
        <Link href="/states" className="btn-secondary">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M10 2 3 6v12h5v-5h4v5h5V6l-7-4Z"/></svg>
          {state ? "Change state" : "Open map"}
        </Link>
      </div>

      {searchParams.fits && searchParams.size && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2.5 text-sm text-brand-100 ring-1 ring-inset ring-brand-400/30">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M3 11l2-5h10l2 5v4h-2a2 2 0 1 1-4 0H7a2 2 0 1 1-4 0H3v-4Zm3-4-1 3h10l-1-3H6Z"/></svg>
          Showing <span className="font-mono font-semibold">{searchParams.size}</span> — fits your <span className="font-semibold">{searchParams.fits}</span>.
        </div>
      )}

      <Suspense>
        <SearchFilters brands={brands} />
      </Suspense>

      {listings.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <span className="text-4xl">🛞</span>
          <p className="mt-3 font-display text-lg font-bold text-slate-200">
            {state ? `No tires in ${stateName(state)} yet` : "No tires match your filters"}
          </p>
          <p className="mt-1 text-sm text-slate-400">Try another state, a wider radius, or fewer filters.</p>
          <Link href="/states" className="btn-secondary mt-4">Browse the map</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} favorited={favSet.has(l.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
