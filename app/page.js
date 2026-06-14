import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { userStateOf, stateName } from "@/lib/states";
import ListingCard from "@/components/ListingCard";
import HeroSearch from "@/components/HeroSearch";
import Faq from "@/components/Faq";
import Logo from "@/components/Logo";
import { BUYER_FAQ } from "@/lib/content";
import { brandSlug } from "@/lib/site";

export const dynamic = "force-dynamic";

const TRUST = [
  { title: "Local tire inventory", body: "Browse new & used sets from resellers in your state.", icon: "pin" },
  { title: "Message sellers directly", body: "Ask questions and make offers without sharing your number.", icon: "chat" },
  { title: "Save searches", body: "Get notified when matching tires are listed near you.", icon: "bell" },
  { title: "Verified Pro sellers", body: "Ratings, reviews, and trusted-seller badges you can vet.", icon: "shield" },
];

const ICONS = {
  pin: '<path d="M10 2a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 10 5a2.5 2.5 0 0 1 0 5.5Z"/>',
  chat: '<path d="M3 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3v-3a1 1 0 0 1-1-1V5a1 1 0 0 1 0-1Z"/>',
  bell: '<path d="M10 2a4 4 0 0 0-4 4v3l-2 3h12l-2-3V6a4 4 0 0 0-4-4Zm0 16a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 10 18Z"/>',
  shield: '<path d="M10 2 3 5v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V5l-7-3Z"/>',
};

export default async function Home() {
  const user = await getCurrentUser();
  const homeState = userStateOf(user);

  const [totalActive, grouped, recent, brandRows] = await Promise.all([
    prisma.listing.count({ where: { status: "active", hidden: false } }),
    prisma.listing.groupBy({ by: ["state"], where: { status: "active", hidden: false }, _count: { _all: true } }),
    prisma.listing.findMany({
      where: { status: "active", hidden: false, ...(homeState ? { state: homeState } : {}) },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: { photos: { take: 1, orderBy: { sort: "asc" } }, seller: { select: { pro: true } } },
    }),
    prisma.listing.findMany({
      where: { status: "active", hidden: false },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
  ]);
  const stateCount = grouped.filter((g) => g.state).length;
  const brands = brandRows.map((b) => b.brand);

  // Fall back to nationwide recent listings if the user's state has none yet.
  const showcase = recent.length
    ? recent
    : await prisma.listing.findMany({
        where: { status: "active", hidden: false },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 4,
        include: { photos: { take: 1, orderBy: { sort: "asc" } }, seller: { select: { pro: true } } },
      });

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 text-white shadow-lift">
        <div className="mesh absolute inset-0" />
        <div className="tread absolute inset-0 opacity-30" />
        <div className="relative px-5 py-10 sm:px-10 sm:py-14">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              {totalActive} tire sets listed across {stateCount} states
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Find tire sets from{" "}
              <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">trusted local resellers</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              New and used tires from real sellers near you — searchable by size, vehicle, or location.
              Browsing is always free.
            </p>
          </div>

          <div className="mt-6 max-w-2xl">
            <HeroSearch homeState={homeState} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
            <Link href={homeState ? `/browse?state=${homeState}` : "/browse"} className="font-semibold text-white underline-offset-4 hover:underline">
              {homeState ? `Browse ${stateName(homeState)} tires →` : "Browse all listings →"}
            </Link>
            <Link href="/states" className="hover:text-white">Open the map</Link>
            <Link href="/guide" className="hover:text-white">Used-tire buying guide</Link>
          </div>
        </div>
      </section>

      {/* Trust bullets */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="card p-5">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[t.icon] }} />
              </span>
              <p className="font-display font-bold text-white">{t.title}</p>
              <p className="mt-1 text-sm text-slate-400">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Listings preview */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Fresh inventory</p>
            <h2 className="font-display text-2xl font-extrabold text-white">
              {homeState && recent.length ? `New near you in ${stateName(homeState)}` : "Recently listed"}
            </h2>
          </div>
          <Link href={homeState ? `/browse?state=${homeState}` : "/browse"} className="btn-secondary shrink-0">View all</Link>
        </div>
        {showcase.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {showcase.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="card grid place-items-center px-6 py-12 text-center">
            <span className="text-3xl">🛞</span>
            <p className="mt-2 font-semibold text-slate-200">No listings yet — be the first to sell.</p>
            <Link href="/sell-tires" className="btn-accent mt-3">Sell tires</Link>
          </div>
        )}
      </section>

      {/* Seller CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lift">
        <div className="tread absolute inset-0 opacity-20" />
        <div className="relative flex flex-col items-start gap-5 px-6 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-brand-100">For resellers</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Sell tire inventory for $10/month</h2>
            <p className="mt-2 text-white/80">
              Move sets faster without the Facebook Marketplace chaos. List unlimited tires, message buyers,
              and track your sales. <span className="font-semibold text-white">First year free.</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link href="/sell-tires" className="btn bg-white text-ink-950 hover:bg-slate-100">Start selling</Link>
            <span className="text-xs text-white/70">$10/month · cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Shop by brand */}
      {brands.length > 0 && (
        <section>
          <div className="mb-3">
            <p className="eyebrow">Shop by brand</p>
            <h2 className="font-display text-2xl font-extrabold text-white">Popular tire brands</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link key={b} href={`/tires/${brandSlug(b)}`}
                className="rounded-full bg-white/5 px-3.5 py-1.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white">
                {b}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">Buyer FAQ</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Buying used tires, demystified</h2>
          <p className="mt-2 text-sm text-slate-400">
            Everything you need to vet a set with confidence. Want the full checklist?{" "}
            <Link href="/guide" className="font-semibold text-brand-300 hover:text-brand-200">Read the buying guide</Link>.
          </p>
          <div className="mt-4 hidden lg:flex">
            <Logo className="h-24 w-24 opacity-80" />
          </div>
        </div>
        <div className="card px-5 py-2">
          <Faq items={BUYER_FAQ} />
        </div>
      </section>
    </div>
  );
}
