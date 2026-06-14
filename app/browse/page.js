import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";
import MarketplaceFilters from "@/components/MarketplaceFilters";
import RecentlyViewed from "@/components/RecentlyViewed";
import { stateName, isStateAbbr } from "@/lib/states";
import { milesBetween } from "@/lib/geo";
import { parseTread } from "@/lib/tire";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const state = searchParams.state && isStateAbbr(searchParams.state) ? searchParams.state.toUpperCase() : null;
  const where = state ? `in ${stateName(state)}` : "near you";
  const brand = searchParams.brand ? `${searchParams.brand} ` : "";
  const title = `Buy ${brand}tires ${where} — TireTrader`;
  return {
    title,
    description: `Browse new & used ${brand}tire sets ${where} from trusted local resellers. Filter by size, vehicle, condition, and price.`,
    alternates: { canonical: state ? `/browse?state=${state}` : "/browse" },
    openGraph: { title, type: "website" },
  };
}

async function getListings(sp, blockedIds = []) {
  const { q, brand, condition, size, maxPrice, sort, state, season, runFlat } = sp;

  const AND = [{ status: "active" }, { hidden: false }];
  if (blockedIds.length) AND.push({ sellerId: { notIn: blockedIds } });
  if (state && isStateAbbr(state)) AND.push({ state: state.toUpperCase() });
  if (brand) AND.push({ brand });
  if (condition) AND.push({ condition });
  if (size) AND.push({ size: { contains: size } });
  if (season) AND.push({ season });
  if (runFlat === "1") AND.push({ runFlat: true });
  if (maxPrice) AND.push({ priceCents: { lte: Math.round(Number(maxPrice) * 100) } });
  if (sp.minYear) AND.push({ dotYear: { gte: Number(sp.minYear) } });
  if (sp.qty) AND.push({ quantity: { gte: Number(sp.qty) } });
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
    include: { photos: { orderBy: { sort: "asc" }, take: 1 }, seller: { select: { pro: true } } },
  });

  // Pro sellers get priority placement (after featured). Stable re-sort.
  const pro = (l) => (l.seller?.pro ? 1 : 0);
  listings.sort((a, b) => (b.featured - a.featured) || (pro(b) - pro(a)));

  // Radius filter (haversine) — applied in JS since SQLite has no geo functions.
  const lat = Number(sp.lat), lng = Number(sp.lng), radius = Number(sp.radius);
  if (sp.lat && sp.lng && radius) {
    listings = listings
      .map((l) => ({ l, d: milesBetween(lat, lng, l.lat, l.lng) }))
      .filter((x) => x.d <= radius)
      .sort((a, b) => (b.l.featured - a.l.featured) || (pro(b.l) - pro(a.l)) || (a.d - b.d))
      .map((x) => ({ ...x.l, _distance: x.d }));
  }

  // Minimum tread depth (32nds) — tread is a free-text string, so filter in JS.
  if (sp.minTread) {
    const min = Number(sp.minTread);
    listings = listings.filter((l) => {
      const n = parseTread(l.treadDepth)?.n;
      return n != null && n >= min;
    });
  }
  return listings;
}

export default async function BrowsePage({ searchParams }) {
  const user = await getCurrentUser();
  let blockedIds = [];
  if (user) {
    const blocks = await prisma.block.findMany({ where: { blockerId: user.id }, select: { blockedId: true } });
    blockedIds = blocks.map((b) => b.blockedId);
  }
  const [listings, brandRows] = await Promise.all([
    getListings(searchParams, blockedIds),
    prisma.listing.findMany({
      where: { status: "active", hidden: false },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
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

  const place = near && radius ? "near you" : state ? `in ${stateName(state)}` : "nationwide";
  const count = listings.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-300">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/states" className="hover:text-brand-300">Map</Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-200">{near && radius ? "Near me" : state ? stateName(state) : "All states"}</span>
          </nav>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">
            {count} tire set{count !== 1 ? "s" : ""} {place}
          </h1>
          <p className="text-sm text-slate-400">New &amp; used sets from local resellers — message sellers directly.</p>
        </div>
        <Link href="/states" className="btn-secondary shrink-0">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M10 2 3 6v12h5v-5h4v5h5V6l-7-4Z"/></svg>
          {state ? "Change state" : "Open map"}
        </Link>
      </div>

      {searchParams.fits && searchParams.size && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2.5 text-sm text-brand-100 ring-1 ring-inset ring-brand-400/30">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M3 11l2-5h10l2 5v4h-2a2 2 0 1 1-4 0H7a2 2 0 1 1-4 0H3v-4Zm3-4-1 3h10l-1-3H6Z"/></svg>
          Showing <span className="font-mono font-semibold">{searchParams.size}</span> — fits your <span className="font-semibold">{searchParams.fits}</span>.
        </div>
      )}

      <MarketplaceFilters brands={brands}>
        <RecentlyViewed />
        {count === 0 ? (
          <div className="card grid place-items-center px-6 py-16 text-center">
            <span className="text-4xl">🛞</span>
            <p className="mt-3 font-display text-lg font-bold text-slate-200">
              {state ? `No tires in ${stateName(state)} yet` : "No tires match your filters"}
            </p>
            <p className="mt-1 text-sm text-slate-400">Try another state, a wider radius, or fewer filters.</p>
            <Link href="/states" className="btn-secondary mt-4">Browse the map</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} favorited={favSet.has(l.id)} distance={l._distance ?? null} />
            ))}
          </div>
        )}
      </MarketplaceFilters>
    </div>
  );
}
