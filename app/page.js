import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ListingCard from "@/components/ListingCard";
import SearchFilters from "@/components/SearchFilters";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

async function getListings(searchParams) {
  const { q, brand, condition, size, maxPrice, sort } = searchParams;

  const AND = [{ status: "active" }];
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

const hasFilters = (sp) =>
  ["q", "brand", "condition", "size", "maxPrice", "sort"].some((k) => sp[k]);

export default async function MarketplacePage({ searchParams }) {
  const listings = await getListings(searchParams);
  const [brandRows, totalActive] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "active" },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.listing.count({ where: { status: "active" } }),
  ]);
  const brands = brandRows.map((b) => b.brand);
  const filtered = hasFilters(searchParams);

  return (
    <div className="space-y-7">
      {/* Hero */}
      {!filtered && (
        <section className="relative overflow-hidden rounded-3xl bg-ink-900 text-white shadow-lift">
          <div className="mesh absolute inset-0" />
          <div className="tread absolute inset-0 opacity-40" />
          <div className="relative grid items-center gap-6 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.4fr_1fr]">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                {totalActive}+ live listings · resellers welcome
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                The marketplace built for{" "}
                <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
                  tire resellers
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-slate-300">
                Stop juggling Facebook listings. Browse new &amp; used tires near you for free — and
                when you&apos;re ready to sell, list unlimited sets for{" "}
                <span className="font-semibold text-white">$10/month</span> with built-in messaging and
                a real seller dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/signup" className="btn-accent">Start selling</Link>
                <a href="#listings" className="btn-secondary bg-white/10 text-white ring-white/20 hover:bg-white/15">
                  Browse tires
                </a>
              </div>
            </div>
            <div className="hidden justify-center lg:flex">
              <div className="relative">
                <div className="absolute -inset-6 rounded-full bg-brand-500/25 blur-3xl" />
                <Logo className="relative h-52 w-52 drop-shadow-2xl" spin bare />
              </div>
            </div>
          </div>
        </section>
      )}

      <div id="listings">
        <Suspense>
          <SearchFilters brands={brands} />
        </Suspense>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            {filtered ? "Search results" : "Latest listings"}
          </h2>
          <p className="text-sm text-slate-500">
            {listings.length} tire set{listings.length !== 1 ? "s" : ""} available
          </p>
        </div>
        {filtered && (
          <Link href="/" className="text-sm font-semibold text-brand-600 hover:underline">
            Clear search
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <Logo className="h-14 w-14 opacity-60" />
          <p className="mt-4 font-display text-lg font-bold text-slate-700">No tires match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Try clearing filters or broadening your search.</p>
          <Link href="/" className="btn-secondary mt-4">Reset filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l, i) => (
            <ListingCard key={l.id} listing={l} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
