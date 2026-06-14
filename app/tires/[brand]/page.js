import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { brandSlug } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import Faq from "@/components/Faq";
import { BUYER_FAQ } from "@/lib/content";

// Brand hubs aren't personalized — cache (ISR) for 5 min to cut DB load at scale.
export const revalidate = 300;

// Resolve a URL slug back to the brand's canonical casing from active listings.
async function resolveBrand(slug) {
  const rows = await prisma.listing.findMany({
    where: { status: "active", hidden: false },
    select: { brand: true },
    distinct: ["brand"],
  });
  const all = rows.map((r) => r.brand);
  const match = all.find((b) => brandSlug(b) === slug);
  return { brand: match || null, allBrands: all.sort() };
}

export async function generateMetadata({ params }) {
  const { brand } = await resolveBrand(params.brand);
  if (!brand) return { title: "Brand not found — TireTrader" };
  const title = `${brand} tires for sale — new & used | TireTrader`;
  const description = `Browse ${brand} tires from local resellers. Compare sizes, tread depth, DOT year, and prices, then message sellers directly on TireTrader.`;
  return {
    title,
    description,
    alternates: { canonical: `/tires/${brandSlug(brand)}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function BrandPage({ params }) {
  const { brand, allBrands } = await resolveBrand(params.brand);
  if (!brand) notFound();

  const listings = await prisma.listing.findMany({
    where: { status: "active", hidden: false, brand },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { photos: { take: 1, orderBy: { sort: "asc" } }, seller: { select: { pro: true } } },
    take: 48,
  });

  const prices = listings.map((l) => l.priceCents);
  const low = prices.length ? Math.min(...prices) : 0;
  const sizes = [...new Set(listings.map((l) => l.size))].slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand} tires for sale`,
    description: `New & used ${brand} tires from local resellers on TireTrader.`,
    ...(listings.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: listings.length,
            itemListElement: listings.slice(0, 20).map((l, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${l.brand} ${l.size}`,
            })),
          },
        }
      : {}),
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-300">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/browse" className="hover:text-brand-300">Tires</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-200">{brand}</span>
      </nav>

      <header>
        <p className="eyebrow">Brand</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">{brand} tires for sale</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          {listings.length > 0 ? (
            <>
              {listings.length} {brand} set{listings.length !== 1 ? "s" : ""} listed by local resellers
              {low ? <> — from <span className="font-semibold text-white">{formatPrice(low)}</span></>: null}. New &amp; used,
              with tread depth and DOT year on every listing.
            </>
          ) : (
            <>No active {brand} listings right now — check back soon or browse all tires.</>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/browse?brand=${encodeURIComponent(brand)}`} className="btn-primary">Filter {brand} in browse</Link>
          <Link href="/browse" className="btn-secondary">Browse all tires</Link>
        </div>
      </header>

      {sizes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-200">Popular {brand} sizes</h2>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <Link key={s} href={`/browse?brand=${encodeURIComponent(brand)}&size=${encodeURIComponent(s)}`}
                className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10">
                {s}
              </Link>
            ))}
          </div>
        </section>
      )}

      {listings.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </section>
      ) : (
        <div className="card grid place-items-center px-6 py-12 text-center">
          <span className="text-3xl">🛞</span>
          <Link href="/browse" className="btn-secondary mt-3">Browse all tires</Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-slate-200">Shop other brands</h2>
        <div className="flex flex-wrap gap-2">
          {allBrands.filter((b) => b !== brand).map((b) => (
            <Link key={b} href={`/tires/${brandSlug(b)}`}
              className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10">
              {b}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">Buying {brand}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Know before you buy</h2>
          <p className="mt-2 text-sm text-slate-400">
            New to used tires? Our <Link href="/guide" className="font-semibold text-brand-300 hover:text-brand-200">buying guide</Link> covers
            tread depth, DOT dates, and how to vet a seller.
          </p>
        </div>
        <div className="card px-5 py-2"><Faq items={BUYER_FAQ.slice(0, 3)} /></div>
      </section>
    </div>
  );
}
