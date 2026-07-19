import Link from "next/link";

export const metadata = {
  title: "Trust & Safety — Buying and Selling Tires Safely | TireTrader",
  description:
    "How TireTrader makes local, in-person tire deals safer: structured listings, fair-price signal, built-in messaging, scam warnings, seller ratings, and a meet-up checklist.",
  alternates: { canonical: "/trust-safety" },
  openGraph: {
    title: "Built for Honest, Face-to-Face Deals — TireTrader Trust & Safety",
    description:
      "Structured listings, scam warnings, seller ratings, and a safe-meetup checklist for local tire deals.",
    type: "website",
    images: ["/opengraph-image"],
  },
};

const TOOLS = [
  ["Structured details", "Size, tread depth, DOT year, condition — so you know what you're looking at before you message anyone."],
  ["Fair-price signal", "A quick read on whether a listing is priced in line with comparable tires."],
  ["Built-in messaging", "Negotiate without handing out your phone number."],
  ["Scam warnings", "TireTrader flags requests to pay off-platform or before you've inspected the tires."],
  ["Seller ratings", "A track record that builds with every completed deal."],
];

const MEETUP = [
  "Meet in a public, well-lit location — a shopping center or shop parking lot works well.",
  "Inspect the tires in person before paying — check tread depth, sidewall condition, and DOT date against the listing.",
  "Bring a friend if you can, especially for a first-time meetup.",
  "Pay only once you're satisfied. TireTrader doesn't process payment — you pay the seller directly, in person.",
];

export default function TrustSafetyPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Trust &amp; Safety</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          Built for Honest, Face-to-Face Deals
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">
          TireTrader isn&apos;t an escrow service or a guarantee — it&apos;s the tools that make a
          local, in-person deal safer and easier to get right.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">What we build into every listing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TOOLS.map(([title, body]) => (
            <div key={title} className="card px-5 py-5">
              <p className="font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">Meeting up safely</h2>
        <ul className="mt-4 space-y-2">
          {MEETUP.map((tip) => (
            <li key={tip} className="card flex gap-3 px-5 py-4 text-sm text-slate-300">
              <span aria-hidden="true" className="font-bold text-brand-400">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card px-6 py-6">
        <h2 className="font-display text-xl font-extrabold text-white">Reporting a problem</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          If a seller or buyer misrepresents a listing, pressures you to pay off-platform before
          inspecting, or otherwise acts in bad faith, report it and we&apos;ll review the account.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/browse" className="btn-primary">Browse tires</Link>
          <Link href="/about" className="font-semibold text-brand-300 hover:underline">Contact us →</Link>
        </div>
      </section>
    </div>
  );
}
