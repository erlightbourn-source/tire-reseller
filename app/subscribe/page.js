import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { stripeConfigured } from "@/lib/stripe";
import SubscribeButton from "@/components/SubscribeButton";

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
  if (user.subscriptionStatus === "active") redirect("/dashboard");

  const live = stripeConfigured();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5 text-center">
        <p className="eyebrow">Seller plan</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900">Sell tires the easy way</h1>
        <p className="mt-2 text-slate-500">One simple price. Everything you need to run your tire resale.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-ink-900 px-6 py-8 text-white">
          <div className="mesh absolute inset-0" />
          <div className="tread absolute inset-0 opacity-30" />
          <div className="relative">
            <p className="text-sm font-medium text-brand-200">TireTrader Seller</p>
            <p className="mt-1 font-display text-5xl font-extrabold">
              $10<span className="text-lg font-medium text-slate-400">/month</span>
            </p>
          </div>
        </div>

        <div className="p-6">
          <ul className="space-y-3">
            {FEATURES.map(([title, sub]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current"><path d="M8 13.2 4.8 10l-1.4 1.4L8 16l8-8-1.4-1.4L8 13.2Z"/></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <SubscribeButton />
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            {live ? (
              <>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><path d="M8 1 2 4v4c0 3.3 2.4 5.8 6 7 3.6-1.2 6-3.7 6-7V4L8 1Z"/></svg>
                Secure checkout via Stripe (test mode)
              </>
            ) : (
              <>⚙️ Dev mode: checkout is simulated until Stripe keys are added to .env</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
