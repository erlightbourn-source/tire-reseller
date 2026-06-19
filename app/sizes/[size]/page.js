import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseTireSize } from "@/lib/tiresize";
import { sizeSlug, SITE_URL } from "@/lib/site";
import { jsonLdHtml } from "@/lib/jsonld";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

// Resolve a size slug ("225-45r17") to its components + canonical label.
function resolve(slug) {
  const { width, aspect, rim } = parseTireSize(String(slug || "").replace(/-/g, "/"));
  if (!width || !aspect || !rim) return null;
  return { width, aspect, rim, label: `${width}/${aspect}R${rim}` };
}

export async function generateMetadata({ params }) {
  const { size } = await params;
  const s = resolve(size);
  if (!s) return { title: "Tire size not found — TireTrader" };
  const title = `${s.label} tires for sale — new & used | TireTrader`;
  const description = `Browse ${s.label} tires from local resellers. Compare condition, tread depth, DOT year, and per-tire price, then message sellers directly.`;
  return {
    title,
    description,
    alternates: { canonical: `/sizes/${sizeSlug(s.label)}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function SizePage({ params }) {
  const { size } = await params;
  const s = resolve(size);
  if (!s) notFound();

  const listings = await prisma.listing.findMany({
    where: { status: "active", hidden: false, widthMm: s.width, aspectRatio: s.aspect, rimDiameter: s.rim },
    orderBy: [{ featured: "desc" }, { sellerPro: "desc" }, { createdAt: "desc" }],
    include: { photos: { take: 1, orderBy: { sort: "asc" } }, seller: { select: { pro: true } } },
    take: 48,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${s.label} tires`,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/listings/${l.id}`,
      name: `${l.brand} ${l.size}`,
    })),
  };

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-300">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/browse" className="hover:text-brand-300">Tires</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-200">{s.label}</span>
      </nav>

      <header>
        <p className="eyebrow">Tire size</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">{s.label} tires for sale</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">
          {listings.length > 0
            ? `${listings.length} ${s.label} set${listings.length !== 1 ? "s" : ""} from local resellers — new and used. Compare tread, DOT year, and per-tire price, then message the seller directly.`
            : `No ${s.label} tires listed right now. Check back soon, or browse other sizes.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={`/browse?size=${encodeURIComponent(s.label)}`} className="font-semibold text-brand-300 hover:underline">Search {s.label} →</Link>
          <Link href={`/browse?size=R${s.rim}`} className="text-slate-400 hover:text-brand-300">All R{s.rim} tires →</Link>
        </div>
      </header>

      {listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="card px-6 py-12 text-center">
          <span className="text-3xl">🛞</span>
          <p className="mt-2 font-semibold text-slate-200">Nothing in {s.label} yet.</p>
          <Link href="/browse" className="btn-primary mt-3">Browse all tires</Link>
        </div>
      )}
    </div>
  );
}
