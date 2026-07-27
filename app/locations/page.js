import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";
import { jsonLdHtml } from "@/lib/jsonld";

export const metadata = {
  title: "Used Tires in South Florida — City by City | TireTrader",
  description:
    "Buy and sell used tires across Broward County — Fort Lauderdale, Pompano Beach, Hollywood, Coral Springs, Pembroke Pines and more. Local pickup, inspect before you pay.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Used Tires in South Florida — City by City | TireTrader",
    description:
      "Buy and sell used tires across Broward County. Local pickup, inspect before you pay.",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default function LocationsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "TireTrader South Florida cities",
    numberOfItems: CITIES.length,
    itemListElement: CITIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Used tires in ${c.name}, FL`,
      url: `${SITE_URL}/used-tires/${c.slug}`,
    })),
  };

  return (
    <div className="space-y-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <header>
        <p className="eyebrow">Locations</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          TireTrader — South Florida, City by City
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">
          Broward County first, then Miami-Dade and Palm Beach. If you don&apos;t see your city yet,
          set a size alert on any city page and we&apos;ll notify you when inventory lands nearby.
        </p>
      </header>

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-400">
          Broward County — launch market
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/used-tires/${c.slug}`}
              className="card group px-5 py-5 transition hover:border-brand-400/40"
            >
              <h3 className="font-display text-lg font-extrabold text-white group-hover:text-brand-300">
                Used Tires in {c.name}, FL
              </h3>
              <p className="mt-2 text-sm text-slate-400">{c.note}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-300">
                Browse {c.name} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card px-6 py-6">
        <h2 className="font-display text-xl font-extrabold text-white">Coming next</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Miami-Dade and Palm Beach open up once Broward inventory is live. Founding Sellers across
          South Florida can{" "}
          <Link href="/founding-seller" className="font-semibold text-brand-300 hover:text-brand-200">
            claim a spot now
          </Link>{" "}
          — the perks don&apos;t expire when we grow.
        </p>
      </section>
    </div>
  );
}
