import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, cityBySlug } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";
import { jsonLdHtml } from "@/lib/jsonld";
import EmailAlertForm from "@/components/EmailAlertForm";

// Fully static local landing pages — pre-rendered at build for every launch city.
export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export const dynamicParams = false; // only the curated city list is valid

export async function generateMetadata({ params }) {
  const { city } = await params;
  const c = cityBySlug(city);
  if (!c) return { title: "City not found — TireTrader" };
  const title = `Used Tires in ${c.name}, FL — Buy & Sell Local | TireTrader`;
  const description = `Find used tires in ${c.name}, FL. Search local sellers by size and brand, see tread depth and DOT year up front, message direct, and inspect before you pay. ${c.name}-area sellers list free.`;
  return {
    title,
    description,
    alternates: { canonical: `/used-tires/${c.slug}` },
    openGraph: { title, description, type: "website", images: ["/opengraph-image"] },
  };
}

export default async function CityPage({ params }) {
  const { city } = await params;
  const c = cityBySlug(city);
  if (!c) notFound();

  const browseHref = `/browse?q=${encodeURIComponent(c.name)}`;

  // Honest schema for a marketplace with no physical storefront in each city:
  // a Service provided across the city (areaServed), NOT a fabricated
  // LocalBusiness address. This is the correct, guideline-compliant way to
  // signal local relevance without claiming a location we don't have.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Used tire marketplace in ${c.name}, FL`,
        serviceType: "Used tire buying and selling",
        areaServed: { "@type": "City", name: `${c.name}, Florida` },
        provider: {
          "@type": "Organization",
          name: "TireTrader",
          url: SITE_URL,
        },
        url: `${SITE_URL}/used-tires/${c.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Locations", item: `${SITE_URL}/locations` },
          { "@type": "ListItem", position: 3, name: `${c.name}, FL`, item: `${SITE_URL}/used-tires/${c.slug}` },
        ],
      },
    ],
  };

  return (
    <div className="space-y-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-300">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/locations" className="hover:text-brand-300">Locations</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-200">{c.name}</span>
      </nav>

      <header>
        <p className="eyebrow">South Florida · {c.county} County</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          Used Tires in {c.name}, FL
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">
          TireTrader connects {c.name} drivers with local tire sellers — search used tires near you
          by size and vehicle, message direct, and meet up to inspect before you pay. No dealer
          markup, no lowball DMs about a couch you&apos;re not selling.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{c.note}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={browseHref} className="btn-primary">Browse {c.name} tires</Link>
          <Link href="/sell-tires" className="font-semibold text-brand-300 hover:underline">
            List your tires in {c.name} →
          </Link>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card px-5 py-5">
          <h2 className="font-display text-lg font-extrabold text-white">Search your exact fit</h2>
          <p className="mt-2 text-sm text-slate-400">
            Every listing shows size, tread depth, DOT week/year, and a fair-price read — so you
            know what you&apos;re looking at before you message anyone.
          </p>
        </div>
        <div className="card px-5 py-5">
          <h2 className="font-display text-lg font-extrabold text-white">Deal local, inspect in person</h2>
          <p className="mt-2 text-sm text-slate-400">
            Message the seller directly, agree on a meet-up in {c.name}, and check the tread yourself.
            You pay the seller directly, in person, when you&apos;re satisfied.
          </p>
        </div>
        <div className="card px-5 py-5">
          <h2 className="font-display text-lg font-extrabold text-white">Selling in {c.name}?</h2>
          <p className="mt-2 text-sm text-slate-400">
            List free and get found by buyers searching your exact fitment — no per-listing fees, no
            cut of your sale. <Link href="/founding-seller" className="font-semibold text-brand-300 hover:text-brand-200">Founding Sellers</Link> get
            a permanent badge and $10/mo locked for life.
          </p>
        </div>
      </section>

      <section className="card px-6 py-6">
        <div className="grid items-center gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">No stock in your size yet?</h2>
            <p className="mt-2 text-sm text-slate-400">
              {c.name} inventory is still growing. Set a size alert and we&apos;ll email you the moment
              a matching set gets listed near you.
            </p>
          </div>
          <div><EmailAlertForm query={`q=${c.name}`} compact /></div>
        </div>
      </section>

      <p className="text-sm text-slate-400">
        Looking beyond {c.name}?{" "}
        <Link href="/locations" className="font-semibold text-brand-300 hover:text-brand-200">
          See all South Florida cities →
        </Link>
      </p>
    </div>
  );
}
