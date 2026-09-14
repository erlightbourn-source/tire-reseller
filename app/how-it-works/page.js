import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { jsonLdHtml } from "@/lib/jsonld";

export const metadata = {
  title: "How TireTrader Works — Buy & Sell Used Tires Locally",
  description:
    "How TireTrader works: search used tires by size and fitment, message sellers directly, inspect in person, and pay the seller when you're satisfied. No escrow, no markup.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How TireTrader Works",
    description:
      "Search by size, message direct, inspect in person, pay the seller. The honest local tire marketplace.",
    type: "website",
    images: ["/opengraph-image"],
  },
};

const BUYER_STEPS = [
  ["Search", "By size, vehicle fitment, brand, or city."],
  ["Compare", "Every listing shows tread depth, DOT age, condition, and a fair-price signal — you're comparing real data, not guesswork."],
  ["Message the seller", "Built-in messaging, no phone number required to start. TireTrader flags off-platform payment requests as a scam risk."],
  ["Inspect and pay in person", "Meet the seller, check the tires yourself, and pay them directly when you're satisfied."],
];

const SELLER_STEPS = [
  ["List", "Size, brand, tread depth, DOT year, photos."],
  ["Get found", "Buyers search your exact fitment — no burying your listing under furniture and video games."],
  ["Talk to real buyers", "Built-in messaging; your seller rating builds as you sell."],
  ["Sell direct", "Meet up, get paid, no marketplace cut."],
];

function Steps({ steps }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map(([title, body], i) => (
        <li key={title} className="card flex gap-4 px-5 py-4">
          <span className="font-display text-2xl font-extrabold text-brand-400">{i + 1}</span>
          <div>
            <p className="font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to buy used tires on TireTrader",
    step: BUYER_STEPS.map(([title, body], i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: title,
      text: body,
      url: `${SITE_URL}/how-it-works`,
    })),
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <header>
        <p className="eyebrow">How it works</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          How TireTrader Works
        </h1>
      </header>

      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">For buyers</h2>
        <Steps steps={BUYER_STEPS} />
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">For sellers</h2>
        <Steps steps={SELLER_STEPS} />
      </section>

      <section className="card px-6 py-6">
        <h2 className="font-display text-xl font-extrabold text-white">An honest, in-person model</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          TireTrader is the marketplace and trust layer — structured listings, messaging, ratings,
          and scam warnings. It is <strong className="text-slate-200">not</strong> an escrow or
          guarantee service. Buyers inspect in person and pay the seller directly, same as any
          trustworthy local deal — we just make it easier to find the right one.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/browse" className="btn-primary">Start browsing</Link>
          <Link href="/sell-tires" className="font-semibold text-brand-300 hover:underline">List your tires →</Link>
        </div>
      </section>
    </div>
  );
}
