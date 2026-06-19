import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, canSell } from "@/lib/auth";
import { SELLER_BENEFITS } from "@/lib/content";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sell tires online for $10/month — TireTrader for resellers",
  description:
    "Move tire inventory faster without Facebook Marketplace chaos. List unlimited sets, message buyers, and track sales. First year free, then $10/month — cancel anytime.",
  alternates: { canonical: "/sell-tires" },
  openGraph: { title: "Sell tires on TireTrader — $10/month", type: "website" },
};

const ICONS = {
  bolt: '<path d="M11 1 3 11h5l-1 8 8-10h-5l1-8Z"/>',
  shield: '<path d="M10 2 3 5v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V5l-7-3Z"/>',
  chat: '<path d="M3 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3v-3a1 1 0 0 1-1-1V5a1 1 0 0 1 0-1Z"/>',
  chart: '<path d="M3 3h2v14H3V3Zm4 7h2v7H7v-7Zm4-4h2v11h-2V6Zm4 7h2v4h-2v-4Z"/>',
  star: '<path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z"/>',
  tag: '<path d="M2 9 9 2h7v7l-7 7-7-7Zm11-3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/>',
};

export default async function SellTiresPage() {
  const user = await getCurrentUser();
  const alreadySelling = canSell(user);
  const totalActive = await prisma.listing.count({ where: { status: "active", hidden: false } });

  // Where the primary CTA should go based on who's viewing.
  const ctaHref = alreadySelling ? "/sell" : user ? "/subscribe" : "/signup?role=seller&next=/subscribe";
  const ctaLabel = alreadySelling ? "Create a listing" : "Start selling free";

  return (
    <div className="space-y-14 pb-20 lg:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 text-white shadow-lift">
        <div className="mesh absolute inset-0" />
        <div className="tread absolute inset-0 opacity-30" />
        <div className="relative grid items-center gap-6 px-6 py-12 sm:px-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              For tire resellers
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl">
              Move tire inventory faster — without the{" "}
              <span className="text-brand-500">Marketplace chaos</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              List unlimited sets with real tire specs, reach buyers searching by size and vehicle, and
              close deals in built-in messaging. Your first year is free.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={ctaHref} className="btn-accent text-base">{ctaLabel}</Link>
              <span className="text-sm text-slate-300"><strong className="text-white">$10/month</strong> after year one · cancel anytime</span>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <Logo className="h-40 w-40 drop-shadow-2xl" spin bare />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <div className="mb-6 text-center">
          <p className="eyebrow">Why sell here</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">Built for tire inventory, not garage-sale clutter</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SELLER_BENEFITS.map((b) => (
            <div key={b.title} className="card p-5">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-black">
                <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[b.icon] }} />
              </span>
              <p className="font-display font-bold text-white">{b.title}</p>
              <p className="mt-1 text-sm text-slate-400">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Listed in three steps</h2>
        </div>
        <ol className="grid gap-5 sm:grid-cols-3">
          {[
            ["Create your seller account", "Sign up as a seller. Your first year of listing is completely free."],
            ["Post your tire sets", "Add size, tread, DOT year, condition, and photos. Bulk-add if you're a Pro."],
            ["Message buyers & sell", "Field questions and offers in-app, then arrange local pickup."],
          ].map(([t, d], i) => (
            <li key={t} className="relative rounded-2xl bg-white/[0.03] p-5 ring-1 ring-inset ring-white/10">
              <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-display font-bold text-black">{i + 1}</span>
              <p className="font-display font-bold text-white">{t}</p>
              <p className="mt-1 text-sm text-slate-400">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-lg">
        <div className="card overflow-hidden text-center">
          <div className="relative overflow-hidden bg-ink-900 px-6 py-8 text-white">
            <div className="mesh absolute inset-0" />
            <div className="relative">
              <p className="text-sm font-medium text-brand-200">TireTrader Seller</p>
              <p className="mt-1 font-display text-5xl font-extrabold">$0<span className="text-lg font-medium text-slate-400"> for year one</span></p>
              <p className="mt-1 text-sm text-slate-400">then $10/month · cancel anytime</p>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-2 text-left text-sm text-slate-300">
              {["Unlimited listings, no per-listing fees", "Built-in buyer messaging & offers", "Seller dashboard with views & analytics", "Verified Pro badge available"].map((t) => (
                <li key={t} className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 fill-emerald-400" aria-hidden="true"><path d="M8 13.2 4.8 10l-1.4 1.4L8 16l8-8-1.4-1.4Z"/></svg>
                  {t}
                </li>
              ))}
            </ul>
            <Link href={ctaHref} className="btn-accent mt-6 w-full justify-center text-base">{ctaLabel}</Link>
            <p className="mt-2 text-xs text-slate-400">Buyers always browse free · {totalActive} sets listed and counting</p>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-950/90 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-bold text-white">Sell tires — first year free</p>
            <p className="text-xs text-slate-400">then $10/mo, cancel anytime</p>
          </div>
          <Link href={ctaHref} className="btn-accent shrink-0">{ctaLabel}</Link>
        </div>
      </div>
    </div>
  );
}
