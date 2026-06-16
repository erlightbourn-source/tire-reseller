import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";
import MarketplaceFilters from "@/components/MarketplaceFilters";
import RecentlyViewed from "@/components/RecentlyViewed";
import EmailAlertForm from "@/components/EmailAlertForm";
import { stateName, isStateAbbr } from "@/lib/states";
import { milesBetween } from "@/lib/geo";
import { parseTread, perTire } from "@/lib/tire";
import { priceContext } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  searchParams = await searchParams; // Next 15: searchParams is a Promise
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
  if (sp.shipping === "1") AND.push({ shipping: true });
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

  // DoS backstop: the radius/tread/rating filters and pagination run in JS over
  // this set, so bound the candidate fetch. 2000 is far beyond any realistic
  // browse depth; if a catalog ever exceeds it, move pagination into the DB.
  let listings = await prisma.listing.findMany({
    where: { AND },
    orderBy,
    include: { photos: { orderBy: { sort: "asc" }, take: 1 }, seller: { select: { pro: true } } },
    take: 2000,
  });

  // Pro sellers get priority placement (after featured). Stable re-sort.
  const pro = (l) => (l.seller?.pro ? 1 : 0);
  listings.sort((a, b) => (b.featured - a.featured) || (pro(b) - pro(a)));

  // Radius filter (haversine) — applied in JS since SQLite has no geo functions.
  const lat = Number(sp.lat), lng = Number(sp.lng), radius = Number(sp.radius);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius) && radius > 0) {
    listings = listings
      .map((l) => ({ l, d: milesBetween(lat, lng, l.lat, l.lng) }))
      .filter((x) => x.d <= radius)
      .sort((a, b) => (b.l.featured - a.l.featured) || (pro(b.l) - pro(a.l)) || (a.d - b.d))
      .map((x) => ({ ...x.l, _distance: x.d }));
  }

  // Minimum tread depth (32nds) — tread is a free-text string, so filter in JS.
  if (sp.minTread) {
    const min = Number(sp.minTread);
    if (Number.isFinite(min)) {
      listings = listings.filter((l) => {
        const n = parseTread(l.treadDepth)?.n;
        return n != null && n >= min;
      });
    }
  }

  // Attach each seller's rating (for card display) and optionally filter by it.
  const sellerIds = [...new Set(listings.map((l) => l.sellerId))];
  if (sellerIds.length) {
    const grouped = await prisma.review.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: sellerIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const rmap = Object.fromEntries(grouped.map((r) => [r.sellerId, { avg: r._avg.rating || 0, count: r._count._all }]));
    listings = listings.map((l) => ({ ...l, _rating: rmap[l.sellerId] || { avg: 0, count: 0 } }));
    if (sp.minRating) {
      const min = Number(sp.minRating);
      if (Number.isFinite(min)) listings = listings.filter((l) => (l._rating?.avg || 0) >= min);
    }
  }

  // Price context per card: build a size → per-tire-prices map from all active
  // listings, then tag each result vs. its size cohort.
  if (listings.length) {
    const all = await prisma.listing.findMany({
      where: { status: "active", hidden: false },
      select: { size: true, priceCents: true, quantity: true },
      take: 5000,
    });
    const bySize = {};
    for (const x of all) (bySize[x.size] ||= []).push(perTire(x.priceCents, x.quantity));
    listings = listings.map((l) => ({ ...l, _fair: priceContext(perTire(l.priceCents, l.quantity), bySize[l.size] || []) }));
  }
  return listings;
}

export default async function BrowsePage({ searchParams }) {
  searchParams = await searchParams; // Next 15: searchParams is a Promise
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

  // Paginate the (already filtered) result set for rendering.
  const PAGE_SIZE = 24;
  const count = listings.length;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, parseInt(searchParams.page) || 1));
  const pageListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  let favSet = new Set();
  if (user && pageListings.length) {
    const favs = await prisma.favorite.findMany({
      where: { userId: user.id, listingId: { in: pageListings.map((l) => l.id) } },
      select: { listingId: true },
    });
    favSet = new Set(favs.map((f) => f.listingId));
  }

  const state = searchParams.state && isStateAbbr(searchParams.state) ? searchParams.state.toUpperCase() : null;
  const near = searchParams.near;
  const radius = searchParams.radius;

  const place = near && radius ? "near you" : state ? `in ${stateName(state)}` : "nationwide";

  // A vehicle search resolves to a specific fitment size from data, independent
  // of our inventory. Results are the exact in-stock matches only — zero is a
  // valid, honest answer. We count tires on the same rim diameter so we can
  // OFFER them as an optional, clearly-labeled link (never as a substitute).
  const rim = searchParams.size ? (String(searchParams.size).match(/R\s?(\d{2})/i) || [])[1] : null;
  let similarCount = 0;
  if (count === 0 && rim) {
    const fAND = [{ status: "active" }, { hidden: false }, { size: { contains: `R${rim}` } }, { size: { not: searchParams.size } }];
    if (blockedIds.length) fAND.push({ sellerId: { notIn: blockedIds } });
    if (state) fAND.push({ state });
    similarCount = await prisma.listing.count({ where: { AND: fAND } });
  }

  const pageHref = (p) => {
    const qs = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k !== "page" && v != null && v !== "") qs.set(k, String(v));
    });
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `/browse${s ? `?${s}` : ""}`;
  };

  const currentQuery = (() => {
    const qs = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k !== "page" && k !== "fits" && v != null && v !== "") qs.set(k, String(v));
    });
    return qs.toString();
  })();

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
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-500/10 px-4 py-2.5 text-sm text-brand-100 ring-1 ring-inset ring-brand-400/30">
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M3 11l2-5h10l2 5v4h-2a2 2 0 1 1-4 0H7a2 2 0 1 1-4 0H3v-4Zm3-4-1 3h10l-1-3H6Z"/></svg>
            Your <span className="font-semibold">{searchParams.fits}</span> takes <span className="font-mono font-semibold">{searchParams.size}</span> —{" "}
            <span className={count > 0 ? "font-semibold text-brand-300" : "font-semibold text-slate-300"}>{count} in stock</span>.
          </span>
          <Link href="/browse" className="font-semibold text-brand-300 hover:underline">Change vehicle</Link>
        </div>
      )}

      <MarketplaceFilters brands={brands}>
        <RecentlyViewed />
        {count === 0 && searchParams.size ? (
          <div className="card px-6 py-12 text-center">
            <span className="text-4xl">🛞</span>
            <p className="mt-3 font-display text-lg font-bold text-slate-200">
              <span className="font-mono text-brand-400">{searchParams.size}</span> — 0 in stock{state ? ` in ${stateName(state)}` : ""} right now
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {searchParams.fits ? `That's the correct size for your ${searchParams.fits}. ` : ""}
              We don't have a match listed yet — get notified, or widen your search.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {similarCount > 0 && (
                <Link href={`/browse?q=R${rim}`} className="btn-primary">
                  See {similarCount} R{rim} tire{similarCount !== 1 ? "s" : ""} that may fit
                </Link>
              )}
              <Link href="/browse" className="btn-secondary">Browse all tires</Link>
            </div>
            <div className="mx-auto mt-6 max-w-md rounded-xl bg-brand-500/5 p-4 ring-1 ring-inset ring-brand-400/20">
              <p className="text-sm font-semibold text-slate-200">Email me when {searchParams.size} is listed</p>
              <p className="mt-0.5 text-xs text-slate-400">No account needed — we'll notify you when a match appears.</p>
              <EmailAlertForm query={currentQuery} />
            </div>
          </div>
        ) : count === 0 ? (
          <div className="card px-6 py-12 text-center">
            <span className="text-4xl">🛞</span>
            <p className="mt-3 font-display text-lg font-bold text-slate-200">
              {state ? `No tires in ${stateName(state)} yet` : "No tires match your filters"}
            </p>
            <p className="mt-1 text-sm text-slate-400">Try clearing filters, a wider radius, or another state.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href={state ? `/browse?state=${state}` : "/browse"} className="btn-secondary">Clear filters</Link>
              <Link href="/states" className="btn-secondary">Open map</Link>
            </div>
            <div className="mx-auto mt-6 max-w-md rounded-xl bg-brand-500/5 p-4 ring-1 ring-inset ring-brand-400/20">
              <p className="text-sm font-semibold text-slate-200">Get notified when these are listed</p>
              <p className="mt-0.5 text-xs text-slate-400">No account needed — we'll email you when a match appears.</p>
              <EmailAlertForm query={currentQuery} />
            </div>
            {brands.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Popular brands</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {brands.slice(0, 10).map((b) => (
                    <Link key={b} href={`/browse?brand=${encodeURIComponent(b)}`}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10">
                      {b}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {pageListings.map((l) => (
                <ListingCard key={l.id} listing={l} favorited={favSet.has(l.id)} distance={l._distance ?? null} rating={l._rating ?? null} fair={l._fair ?? null} />
              ))}
            </div>
            {pageCount > 1 && (
              <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pagination">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="btn-secondary" rel="prev">← Previous</Link>
                ) : (
                  <span className="btn-secondary pointer-events-none opacity-40" aria-disabled="true">← Previous</span>
                )}
                <span className="text-sm text-slate-400">Page {page} of {pageCount}</span>
                {page < pageCount ? (
                  <Link href={pageHref(page + 1)} className="btn-secondary" rel="next">Next →</Link>
                ) : (
                  <span className="btn-secondary pointer-events-none opacity-40" aria-disabled="true">Next →</span>
                )}
              </nav>
            )}
          </>
        )}
      </MarketplaceFilters>
    </div>
  );
}
