import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, canSell } from "@/lib/auth";
import BulkAdd from "@/components/BulkAdd";

export const dynamic = "force-dynamic";

export default async function BulkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell/bulk");
  if (!canSell(user)) redirect("/subscribe");

  if (!user.pro) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card overflow-hidden text-center">
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-accent-600/10 px-6 py-8 text-black">
            <span className="badge bg-gradient-to-r from-amber-400 to-accent-500 text-ink-950">PRO</span>
            <h1 className="mt-3 font-display text-xl font-bold">Bulk add is a Pro feature</h1>
          </div>
          <div className="p-6">
            <p className="text-slate-400">List a whole batch of tires in one paste. Upgrade to Pro to unlock it.</p>
            <Link href="/pro" className="btn-accent mt-4">See TireTrader Pro</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="badge bg-gradient-to-r from-amber-400 to-accent-500 text-ink-950">PRO</span>
        <h1 className="font-display text-2xl font-extrabold text-white">Bulk add listings</h1>
      </div>
      <div className="card p-6">
        <BulkAdd />
      </div>
    </div>
  );
}
