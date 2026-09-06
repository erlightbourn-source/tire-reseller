import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, canSell, sellerStatus } from "@/lib/auth";
import { priceFor } from "@/lib/pricing";
import ListingForm from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell");

  if (!canSell(user)) {
    const expired = sellerStatus(user) === "expired";
    const plan = priceFor(user);
    return (
      <div className="mx-auto max-w-lg">
        <div className="card overflow-hidden text-center">
          <div className="relative overflow-hidden bg-ink-900 px-6 py-8 text-white">
            <div className="mesh absolute inset-0" />
            <span className="relative inline-grid h-14 w-14 place-items-center bg-white/10 text-2xl ring-1 ring-white/15">
              {expired ? "🔒" : "🏷️"}
            </span>
            <h1 className="relative mt-3 font-display text-xl font-bold">
              {expired ? "Your launch listing period has ended" : "Become a seller to list tires"}
            </h1>
          </div>
          <div className="p-6">
            <p className="text-slate-400">
              {expired ? (
                <>Continue listing, messaging buyers, and tracking activity for <strong className="text-white">{plan.label}</strong>{plan.locked ? ", locked for life" : ""}.</>
              ) : (
                <>List unlimited tires, message buyers, and track your activity — <strong className="text-white">free to list during launch</strong>, then {plan.label}.</>
              )}
            </p>
            <Link href="/subscribe" className="btn-accent mt-4">
              {expired ? `Subscribe — ${plan.short}` : "Start selling free"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <p className="eyebrow">New listing</p>
        <h1 className="font-display text-2xl font-extrabold text-white">List a set of tires</h1>
      </div>
      <div className="card p-6">
        <ListingForm />
      </div>
    </div>
  );
}
