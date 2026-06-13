import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildListingWhere } from "@/lib/listingFilter";
import SavedSearchRow from "@/components/SavedSearchRow";

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/saved");

  const searches = await prisma.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const withCounts = await Promise.all(
    searches.map(async (s) => {
      const params = Object.fromEntries(new URLSearchParams(s.query));
      const AND = buildListingWhere(params);
      AND.push({ createdAt: { gt: s.lastSeenAt } });
      const newCount = await prisma.listing.count({ where: { AND } });
      return { ...s, newCount };
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="eyebrow">Alerts</p>
        <h1 className="font-display text-2xl font-extrabold text-white">Saved searches</h1>
        <p className="text-sm text-slate-400">
          We track new matches for each search. {withCounts.some((s) => s.newCount > 0) ? "You've got new tires waiting." : "Browse and hit “Save search” to add one."}
        </p>
      </div>

      {withCounts.length === 0 ? (
        <div className="card grid place-items-center px-6 py-14 text-center">
          <span className="text-4xl">🔔</span>
          <p className="mt-3 font-display text-lg font-bold text-slate-200">No saved searches yet</p>
          <p className="mt-1 text-sm text-slate-400">Set up filters on the browse page, then tap “Save search”.</p>
          <Link href="/browse" className="btn-secondary mt-4">Browse tires</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {withCounts.map((s) => (
            <SavedSearchRow key={s.id} search={s} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        In a production build these become email/push alerts. For now, new-match counts update here.
      </p>
    </div>
  );
}
