import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, canSell, sellerStatus } from "@/lib/auth";
import { isProSeller } from "@/lib/seller";
import { stripeConfigured } from "@/lib/stripe";
import { priceFor, PLAN_NAME, PLAN_COPY } from "@/lib/pricing";
import ProButton from "@/components/ProButton";
import SubscribeButton from "@/components/SubscribeButton";

export const dynamic = "force-dynamic";

// ONE seller plan. This page describes what the plan includes, tier-aware:
// a founding seller sees their locked founding price, everyone else standard.
const PERKS = [
  ["🚀", "Priority placement", "Your listings rank above unsubscribed sellers in every search."],
  ["✅", "Verified badge", "A trust badge on your profile and every listing."],
  ["📥", "Bulk listing tool", "Add a whole batch of tires in one paste — perfect for shops."],
  ["⭐", "Unlimited featured", "Promote as many listings as you want, anytime."],
  ["📈", "Priority support", "Jump the line when you need help."],
];

export default async function ProPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pro");

  const plan = priceFor(user);
  const eligible = canSell(user);
  const status = sellerStatus(user); // none | free | expired | paid
  const perksActive = isProSeller(user); // paid plan OR founding seller
  const subscribed = user.subscriptionStatus === "active";
  const live = stripeConfigured();

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="text-center">
        <p className="eyebrow">For serious sellers</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white">The {PLAN_NAME} plan</h1>
        <p className="mt-2 text-slate-400">{PLAN_COPY.perksIncluded}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-brand-500/15 px-6 py-8 text-white">
          <div className="tread absolute inset-0 opacity-20" />
          <div className="relative">
            <span className="badge bg-brand-500 text-ink-950">{plan.locked ? "FOUNDING SELLER" : "SELLER PLAN"}</span>
            <p className="mt-2 font-display text-5xl font-extrabold">
              ${plan.monthly}<span className="text-lg font-medium text-slate-300">/month</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {plan.locked ? "Your founding price — locked for life. Cancel anytime." : "Cancel anytime."}
            </p>
          </div>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {PERKS.map(([icon, title, sub]) => (
              <li key={title} className="flex gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            {status === "none" ? (
              <Link href="/subscribe" className="btn-accent w-full justify-center">Become a seller first</Link>
            ) : status === "expired" ? (
              // Launch window ended and not paying: the plan is the way back in.
              <SubscribeButton label={`Subscribe — ${plan.label}`} />
            ) : status === "free" ? (
              // Launch-window seller: promised "no card required" — never bill here.
              <div className="bg-slate-500/10 px-4 py-3 text-center text-sm text-slate-300 ring-1 ring-inset ring-slate-400/20">
                Your listings are free until {new Date(user.sellerFreeUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. Billing at {plan.label} starts after that; nothing to do now.
              </div>
            ) : perksActive ? (
              <div className="bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                ✓ Every perk above is active on your account.{" "}
                <Link href="/sell/bulk" className="font-semibold underline-offset-4 hover:underline">Try bulk add →</Link>
              </div>
            ) : subscribed ? (
              // Active subscriber whose perks flag is off (activated before perks
              // were bundled into the plan) — one click repairs it.
              <ProButton label="Activate plan perks" />
            ) : (
              <SubscribeButton label={`Subscribe — ${plan.label}`} />
            )}
          </div>
          {eligible && !perksActive && (
            <p className="mt-3 text-center text-xs text-slate-400">
              {live ? "Secure checkout via Stripe" : "⚙️ Dev mode: checkout is simulated until Stripe keys are added to .env"}
            </p>
          )}
          {!plan.locked && !perksActive && (
            <p className="mt-2 text-center text-xs text-slate-400">
              {PLAN_COPY.foundingStory}{" "}
              <Link href="/founding-seller" className="font-semibold text-brand-300 hover:underline">Founding Seller program →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
