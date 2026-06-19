import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { userStateOf, stateName } from "@/lib/states";
import StateMap from "@/components/StateMap";
import VehicleFinder from "@/components/VehicleFinder";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function StatesPage() {
  const [user, grouped, totalActive] = await Promise.all([
    getCurrentUser(),
    prisma.listing.groupBy({
      by: ["state"],
      where: { status: "active" },
      _count: { _all: true },
    }),
    prisma.listing.count({ where: { status: "active" } }),
  ]);

  const counts = {};
  for (const g of grouped) if (g.state) counts[g.state] = g._count._all;

  const selected = userStateOf(user);
  const statesWithListings = Object.keys(counts).length;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 text-white shadow-lift">
        <div className="mesh absolute inset-0" />
        <div className="tread absolute inset-0 opacity-40" />
        <div className="relative grid items-center gap-6 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              {totalActive} listings across {statesWithListings} states
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Find tires{" "}
              <span className="text-brand-500">near you</span>
            </h1>
            <p className="mt-4 max-w-xl text-slate-300">
              {user && selected ? (
                <>Pick a state to browse. Your home state, <span className="font-semibold text-white">{stateName(selected)}</span>, is marked — choosing a new one updates your profile.</>
              ) : (
                <>Pick your state to see new &amp; used tires for sale locally. Browsing is always free — sellers list for $10/month (first year on us).</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {selected && (
                <Link href={`/browse?state=${selected}`} className="btn-accent">
                  Browse {stateName(selected)} tires
                </Link>
              )}
              <Link href="/browse" className="btn-secondary bg-white/10 text-white ring-white/20 hover:bg-white/15">
                Browse all states
              </Link>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-brand-500/25 blur-3xl" />
              <Logo className="relative h-44 w-44 drop-shadow-2xl" spin bare />
            </div>
          </div>
        </div>
      </section>

      <StateMap counts={counts} selected={selected} loggedIn={!!user} />
      <VehicleFinder stateParam={selected} />
    </div>
  );
}
