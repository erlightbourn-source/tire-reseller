import { redirect } from "next/navigation";
import { getCurrentUser, sellerStatus, freeYearFromNow } from "@/lib/auth";
import { stripeConfigured } from "@/lib/stripe";
import BecomeSeller from "@/components/BecomeSeller";

export const dynamic = "force-dynamic";

const FEATURES = [
  ["List unlimited tire sets", "No per-listing fees, ever."],
  ["Built-in buyer messaging", "Negotiate without sharing your number."],
  ["Seller activity dashboard", "Track views, chats, and inventory value."],
  ["Manage everything", "Edit, mark sold, and delete in a click."],
  ["Cancel anytime", "No contracts. Keep it as long as it pays off."],
];

export default async function SubscribePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/subscribe");

  const status = sellerStatus(user);
  // Already selling (free or paid) — nothing to buy.
  if (status === "free" || status === "paid") redirect("/dashboard");

  // expired sellers must pay; everyone else gets the free first year.
  const expired = status === "expired";
  const live = stripeConfigured();
  const freeEnds = freeYearFromNow().toLocaleDateString();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5 text-center">
        <p className="eyebrow">Seller plan</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white">
          {expired ? "Keep selling on TireTrader" : "Start selling — your first year is free"}
        </h1>
        <p className="mt-2 text-slate-400">
          {expired
            ? "Your free year has ended. Continue with the seller plan for $10/month."
            : "Buyers always browse free. Sellers get a full year on us — then it's just $10/month."}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-ink-900 px-6 py-8 text-white">
          <div className="mesh absolute inset-0" />
          <div className="tread absolute inset-0 opacity-30" />
          <div className="relative">
            <p className="text-sm font-medium text-brand-200">TireTrader Seller</p>
            {expired ? (
              <p className="mt-1 font-display text-5xl font-extrabold">
                $10<span className="text-lg font-medium text-slate-400">/month</span>
              </p>
            ) : (
              <>
                <p className="mt-1 font-display text-5xl font-extrabold">
                  $0<span className="text-lg font-medium text-slate-400"> for year one</span>
                </p>
                <p className="mt-1 text-sm text-slate-400">then $10/month after {freeEnds} · cancel anytime</p>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          {!expired && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current"><path d="M8 13.2 4.8 10l-1.4 1.4L8 16l8-8-1.4-1.4Z" /></svg>
              First year free — <strong>$0 today, no card required.</strong>
            </div>
          )}

          <ul className="space-y-3">
            {FEATURES.map(([title, sub]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current"><path d="M8 13.2 4.8 10l-1.4 1.4L8 16l8-8-1.4-1.4L8 13.2Z" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <BecomeSeller expired={expired} />
          </div>

          {expired ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              {live ? "Secure checkout via Stripe (test mode)" : "⚙️ Dev mode: checkout is simulated until Stripe keys are added to .env"}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-slate-400">
              You won't be charged today. We'll only ask for payment when your free year ends.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
