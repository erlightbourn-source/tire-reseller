import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, canSell } from "@/lib/auth";
import { isProSeller } from "@/lib/seller";
import BulkAdd from "@/components/BulkAdd";

export const dynamic = "force-dynamic";

export default async function BulkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell/bulk");
  if (!canSell(user)) redirect("/subscribe");

  if (!isProSeller(user)) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card overflow-hidden text-center">
          <div className="relative overflow-hidden bg-brand-500/15 px-6 py-8 text-white">
            <span className="badge bg-brand-500 text-ink-950">PRO</span>
            <h1 className="mt-3 font-display text-xl font-bold">Bulk add is part of the seller plan</h1>
          </div>
          <div className="p-6">
            <p className="text-slate-400">List a whole batch of tires in one paste. It unlocks as soon as your seller plan is active.</p>
            <Link href="/pro" className="btn-accent mt-4">See the seller plan</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="badge bg-brand-500 text-ink-950">PRO</span>
        <h1 className="font-display text-2xl font-extrabold text-white">Bulk add listings</h1>
      </div>
      <div className="card p-6">
        <BulkAdd />
      </div>
    </div>
  );
}
