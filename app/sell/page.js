import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isActiveSeller } from "@/lib/auth";
import ListingForm from "@/components/ListingForm";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell");

  if (!isActiveSeller(user)) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card overflow-hidden text-center">
          <div className="relative overflow-hidden bg-ink-900 px-6 py-8 text-white">
            <div className="mesh absolute inset-0" />
            <span className="relative inline-grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15">🔒</span>
            <h1 className="relative mt-3 font-display text-xl font-bold">Selling requires a subscription</h1>
          </div>
          <div className="p-6">
            <p className="text-slate-500">
              List unlimited tires, message buyers, and track your activity for{" "}
              <strong className="text-slate-800">$10/month</strong>.
            </p>
            <Link href="/subscribe" className="btn-accent mt-4">Become a seller</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <p className="eyebrow">New listing</p>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">List a set of tires</h1>
      </div>
      <div className="card p-6">
        <ListingForm />
      </div>
    </div>
  );
}
