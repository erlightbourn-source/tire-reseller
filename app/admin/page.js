import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import AdminButton from "@/components/AdminButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation — TireTrader", robots: { index: false } };

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!isAdmin(me)) notFound();

  const [flagged, users, audit] = await Promise.all([
    prisma.listing.findMany({
      where: { OR: [{ hidden: true }, { reports: { some: {} } }] },
      include: {
        seller: { select: { id: true, name: true } },
        reports: { select: { reason: true } },
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, role: true, admin: true, deletedAt: true, createdAt: true, _count: { select: { listings: true } } },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Moderator</p>
        <h1 className="font-display text-2xl font-extrabold text-white">Moderation</h1>
        <p className="text-sm text-slate-400">Review reported & hidden listings, manage accounts, and see recent security events.</p>
      </div>

      {/* Reported / hidden listings */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-white">Reported &amp; hidden listings ({flagged.length})</h2>
        {flagged.length === 0 ? (
          <div className="card px-5 py-8 text-center text-sm text-slate-400">Nothing needs review. 🎉</div>
        ) : (
          <div className="card divide-y divide-white/5">
            {flagged.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/listings/${l.id}`} className="font-display font-bold text-white hover:underline">{l.brand} · {l.size}</Link>
                    {l.hidden && <span className="badge bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30">Hidden</span>}
                    {l._count.reports > 0 && <span className="badge bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30">{l._count.reports} report{l._count.reports !== 1 ? "s" : ""}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatPrice(l.priceCents)} · by <Link href={`/sellers/${l.seller.id}`} className="hover:underline">{l.seller.name}</Link> · {timeAgo(l.createdAt)}
                    {l.reports.length > 0 && <> · reasons: {[...new Set(l.reports.map((r) => r.reason))].join(", ")}</>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {l.hidden
                    ? <AdminButton action="unhideListing" id={l.id} label="Unhide" className="btn-secondary" />
                    : <AdminButton action="hideListing" id={l.id} label="Hide" className="btn-secondary" />}
                  <AdminButton action="deleteListing" id={l.id} label="Delete" className="btn-danger" confirm="Permanently delete this listing?" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent users */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-white">Recent accounts</h2>
        <div className="card divide-y divide-white/5">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{u.name}</span>
                  <span className="text-xs text-slate-500">{u.email}</span>
                  {u.admin && <span className="badge bg-brand-500/15 text-brand-200 ring-1 ring-inset ring-brand-400/30">Admin</span>}
                  {u.deletedAt && <span className="badge bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30">Deleted</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{u.role} · {u._count.listings} listings · joined {timeAgo(u.createdAt)}</p>
              </div>
              {!u.admin && (
                <div className="shrink-0">
                  {u.deletedAt
                    ? <AdminButton action="unbanUser" id={u.id} label="Restore" className="btn-secondary" />
                    : <AdminButton action="banUser" id={u.id} label="Ban" className="btn-danger" confirm={`Ban ${u.name}? This hides their listings and signs them out.`} />}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Audit log */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-white">Recent security events</h2>
        <div className="card divide-y divide-white/5 text-sm">
          {audit.length === 0 ? (
            <p className="px-5 py-6 text-center text-slate-400">No events yet.</p>
          ) : audit.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="font-mono text-xs text-slate-200">{a.action}</span>
              <span className="text-xs text-slate-500">{a.ip || "—"} · {timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
