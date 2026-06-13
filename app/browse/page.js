import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ListingCard from "@/components/ListingCard";
import SearchFilters from "@/components/SearchFilters";
import { stateName, isStateAbbr } from "@/lib/states";

export const dynamic = "force-dynamic";

async function getListings(searchParams) {
  const { q, brand, condition, size, maxPrice, sort, state } = searchParams;

  const AND = [{ status: "active" }];
  if (state && isStateAbbr(state)) AND.push({ state: state.toUpperCase() });
  if (brand) AND.push({ brand });
  if (condition) AND.push({ condition });
  if (size) AND.push({ size: { contains: size } });
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

  let orderBy = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { priceCents: "asc" };
  if (sort === "price_desc") orderBy = { priceCents: "desc" };

  return prisma.listing.findMany({
    where: { AND },
    orderBy,
    include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
  });
}

export default async function BrowsePage({ searchParams }) {
  const listings = await getListings(searchParams);
  const brandRows = await prisma.listing.findMany({
    where: { status: "active" },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  const brands = brandRows.map((b) => b.brand);

  const state = searchParams.state && isStateAbbr(searchParams.state) ? searchParams.state.toUpperCase() : null;
  const otherFilters = ["q", "brand", "condition", "size", "maxPrice", "sort"].some((k) => searchParams[k]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/states" className="hover:text-brand-300">Map</Link>
            <span>/</span>
            <span className="font-medium text-slate-200">{state ? stateName(state) : "All states"}</span>
          </nav>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">
            {state ? `Tires in ${stateName(state)}` : "All listings"}
          </h1>
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

      <Suspense>
        <SearchFilters brands={brands} />
      </Suspense>

      {listings.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <span className="text-4xl">🛞</span>
          <p className="mt-3 font-display text-lg font-bold text-slate-200">
            {state ? `No tires in ${stateName(state)} yet` : "No tires match your filters"}
          </p>
          <p className="mt-1 text-sm text-slate-400">Try another state or broaden your search.</p>
          <Link href="/states" className="btn-secondary mt-4">Browse the map</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
