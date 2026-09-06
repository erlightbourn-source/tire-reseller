import Link from "next/link";
import { FoundingBadge } from "@/components/Badge";
import { FOUNDING_SEATS, FOUNDING_LABEL, FOUNDING_SHORT, PLAN_COPY, foundingSpotsLine } from "@/lib/pricing";
import { getFoundingClaimed } from "@/lib/founding";

// Renders per request so the founding-seat counter is live (cached 60s in lib/founding.js).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founding Seller Program — TireTrader",
  description:
    `Be one of the first ${FOUNDING_SEATS} South Florida sellers on TireTrader. Permanent Founding Seller badge, every seller-plan perk included, homepage spotlight, and ${FOUNDING_SHORT} locked for life.`,
  alternates: { canonical: "/founding-seller" },
  openGraph: {
    title: "TireTrader Founding Seller Program — Be First, Stay Ahead",
    description:
      `First ${FOUNDING_SEATS} South Florida sellers: permanent badge, every plan perk included, price locked at ${FOUNDING_SHORT} forever.`,
    type: "website",
    images: ["/opengraph-image"],
  },
};

const PERKS = [
  ["Permanent Founding Seller badge", "On your profile, every listing, every card. It never goes away, even after the program closes."],
  ["Every seller-plan perk, included", "Priority search placement, the verified badge, and bulk listing — all part of the plan, at no extra cost for founders."],
  [`Price locked at ${FOUNDING_LABEL} — forever`, "When standard pricing eventually changes, yours doesn't."],
  ["Homepage spotlight", "Featured placement while we build out inventory."],
  ["White-glove onboarding", "We'll personally help you shoot and upload your first batch of listings in Broward. Zero extra work on your end."],
];

export default async function FoundingSellerPage() {
  const spots = foundingSpotsLine(await getFoundingClaimed());
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <p className="eyebrow">Founding Seller Program</p>
          <FoundingBadge />
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          Be First, Stay Ahead
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">
          We&apos;re launching TireTrader with {FOUNDING_SEATS} South Florida sellers, not 2,500. Get in as a
          founder and the perks don&apos;t expire when we grow.
        </p>
        <p className="mt-4 max-w-2xl bg-brand-500/5 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-brand-400/20">
          <span className="font-semibold text-white">{PLAN_COPY.launchFree}</span>{" "}
          {PLAN_COPY.foundingStory}
        </p>
        {spots && (
          <p className="mt-3 inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-200 ring-1 ring-inset ring-white/10">
            <span className="h-1.5 w-1.5 bg-accent-400" />
            {spots}
          </p>
        )}
        <div className="mt-5">
          <Link href="/sell-tires" className="btn-primary">Claim your Founding Seller spot</Link>
        </div>
      </header>

      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">What you get</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PERKS.map(([title, body]) => (
            <div key={title} className="card px-5 py-5">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">{title}</p>
                {title.includes("Founding Seller badge") && <FoundingBadge />}
              </div>
              <p className="mt-1 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card px-6 py-6">
          <h2 className="font-display text-xl font-extrabold text-white">Who this is for</h2>
          <p className="mt-2 text-sm text-slate-400">
            South Florida tire shops and resellers who already move inventory and want to be found
            by buyers searching specifically for tires — not buried in a general marketplace feed.
          </p>
        </div>
        <div className="card px-6 py-6">
          <h2 className="font-display text-xl font-extrabold text-white">Why only 25</h2>
          <p className="mt-2 text-sm text-slate-400">
            A tire marketplace is only as good as its inventory. We&apos;re building real supply with
            a small group of serious sellers first, then opening it up to buyers. Founders get the
            recognition — and the locked-in pricing — for helping us launch it right.
          </p>
        </div>
      </section>

      <section className="card px-6 py-6 text-center">
        <h2 className="font-display text-xl font-extrabold text-white">Ready to be a founder?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          List free today and we&apos;ll help you get your first tires up. Founding spots are limited
          to the first {FOUNDING_SEATS} South Florida sellers.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/sell-tires" className="btn-primary">Claim your spot</Link>
          <Link href="/how-it-works" className="font-semibold text-brand-300 hover:underline">How selling works →</Link>
        </div>
      </section>
    </div>
  );
}
