import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { jsonLdHtml } from "@/lib/jsonld";

// Branded contact address. hello@tirekind.com forwards to the owner inbox via
// Cloudflare Email Routing (live 2026-09-24; CF activity log shows it Forwarded).
const CONTACT_EMAIL = "hello@tirekind.com";
const IG = "tire_trader";
const TIKTOK = "tirekind";  // @tire.trader renamed @tirekind 2026-09-23 (TireKind rebrand)

export const metadata = {
  title: "About TireKind — Built in Broward for South Florida Drivers",
  description:
    "TireKind is a South Florida used-tire marketplace built by EV Tech Solutions LLC. Launching Broward-first, working directly with local sellers for real inventory from day one.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About TireKind",
    description: "Built in Broward, for South Florida drivers. A no-markup local tire marketplace.",
    url: "/about",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TireKind",
    url: SITE_URL,
    description:
      "A South Florida used-tire marketplace connecting local drivers with tire sellers. Built by EV Tech Solutions LLC.",
    email: CONTACT_EMAIL,
    areaServed: { "@type": "AdministrativeArea", name: "South Florida" },
    sameAs: [
      `https://www.instagram.com/${IG}`,
      `https://www.tiktok.com/@${TIKTOK}`,
    ],
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <header>
        <p className="eyebrow">About</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          Built in Broward, for South Florida Drivers
        </h1>
      </header>

      <section className="card px-6 py-6">
        <h2 className="font-display text-xl font-extrabold text-white">Why we built this</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Buying and selling tires on a general marketplace means wading through furniture, video
          games, and lowball DMs to find one real buyer. TireKind is built for one thing — getting
          South Florida drivers matched with the right tires, from sellers who actually have them,
          without the markup of a tire shop.
        </p>
      </section>

      <section className="card px-6 py-6">
        <h2 className="font-display text-xl font-extrabold text-white">Who&apos;s behind it</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          TireKind is built by EV Tech Solutions LLC, based in South Florida. We&apos;re launching
          Broward-first, working directly with local sellers to get real inventory on the platform
          from day one.
        </p>
      </section>

      <section className="card px-6 py-6">
        <h2 className="font-display text-xl font-extrabold text-white">Contact</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Questions, a listing issue, or want to become a Founding Seller? Reach us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-300 hover:text-brand-200">
            {CONTACT_EMAIL}
          </a>{" "}
          or find us on{" "}
          <a href={`https://www.instagram.com/${IG}`} className="font-semibold text-brand-300 hover:text-brand-200" rel="noopener noreferrer" target="_blank">Instagram (@{IG})</a>{" "}
          and{" "}
          <a href={`https://www.tiktok.com/@${TIKTOK}`} className="font-semibold text-brand-300 hover:text-brand-200" rel="noopener noreferrer" target="_blank">TikTok (@{TIKTOK})</a>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/founding-seller" className="btn-primary">Become a Founding Seller</Link>
          <Link href="/browse" className="font-semibold text-brand-300 hover:underline">Browse tires →</Link>
        </div>
      </section>
    </div>
  );
}
