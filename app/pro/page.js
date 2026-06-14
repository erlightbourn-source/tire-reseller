import { redirect } from "next/navigation";
import { getCurrentUser, canSell } from "@/lib/auth";
import ProButton from "@/components/ProButton";

export const dynamic = "force-dynamic";

const PERKS = [
  ["🚀", "Priority placement", "Your listings rank above standard sellers in every search."],
  ["✅", "Pro badge", "A trust badge on your profile and every listing."],
  ["📥", "Bulk listing tool", "Add a whole batch of tires in one paste — perfect for shops."],
  ["⭐", "Unlimited featured", "Promote as many listings as you want, anytime."],
  ["📈", "Priority support", "Jump the line when you need help."],
];

export default async function ProPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pro");

  const eligible = canSell(user);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="text-center">
        <p className="eyebrow">For serious sellers</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white">TireTrader Pro</h1>
        <p className="mt-2 text-slate-400">Sell more, faster — with priority placement and shop-grade tools.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-accent-600/10 px-6 py-8 text-white">
          <div className="tread absolute inset-0 opacity-20" />
          <div className="relative">
            <span className="badge bg-gradient-to-r from-amber-400 to-accent-500 text-ink-950">PRO</span>
            <p className="mt-2 font-display text-5xl font-extrabold">$25<span className="text-lg font-medium text-slate-300">/month</span></p>
            <p className="mt-1 text-sm text-slate-300">On top of your seller plan. Cancel anytime.</p>
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
            {eligible ? (
              <ProButton isPro={user.pro} />
            ) : (
              <a href="/subscribe" className="btn-accent w-full">Become a seller first</a>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">⚙️ Demo: upgrade is simulated. Real billing uses Stripe.</p>
        </div>
      </div>
    </div>
  );
}
