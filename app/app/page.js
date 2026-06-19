import Link from "next/link";
import Logo from "@/components/Logo";
import NotifyApp from "@/components/NotifyApp";
import InstallApp from "@/components/InstallApp";

export const metadata = { title: "TireTrader app — coming soon" };

const FEATURES = [
  ["📸", "Snap & list in seconds", "Photograph a tire and post it before the buyer leaves the lot."],
  ["🔔", "Instant message alerts", "Push notifications the moment a buyer reaches out."],
  ["📍", "Tires near you", "Browse local inventory on the go with one tap."],
];

function StoreBadge({ store, sub }) {
  return (
    <span className="inline-flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 opacity-80">
      <span className="text-2xl">{store === "apple" ? "" : "▶"}</span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-slate-400">{sub}</span>
        <span className="block font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </span>
  );
}

export default function AppPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-10 text-center text-white sm:px-10 sm:py-14">
        <div className="mesh absolute inset-0" />
        <div className="tread absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="mx-auto mb-4 w-fit"><Logo className="h-16 w-16" spin bare /></div>
          <span className="badge bg-white/10 text-brand-100 ring-1 ring-inset ring-white/15">Coming soon</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">TireTrader in your pocket</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            We're building native iOS &amp; Android apps so you can buy and sell tires anywhere.
            Want first dibs? Drop your email and we'll ping you at launch.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <InstallApp />
            <p className="text-xs text-slate-400">Available now as an installable web app — works offline-ish, no store needed.</p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3 opacity-80">
            <StoreBadge store="apple" sub="Download on the" />
            <StoreBadge store="google" sub="Get it on" />
          </div>
          <p className="mt-2 text-xs text-slate-400">Native store apps coming soon — badges are placeholders.</p>

          <div className="mx-auto mt-6 max-w-md text-left">
            <NotifyApp />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map(([icon, title, sub]) => (
          <div key={title} className="card p-4">
            <p className="text-2xl">{icon}</p>
            <p className="mt-2 font-display font-bold text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-400">
        In the meantime, <Link href="/browse" className="font-semibold text-brand-300 hover:underline">browse on the web</Link> — it works great on mobile.
      </p>
    </div>
  );
}
