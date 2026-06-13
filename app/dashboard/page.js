import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      photos: { take: 1, orderBy: { sort: "asc" } },
      _count: { select: { threads: true } },
    },
  });

  const active = listings.filter((l) => l.status === "active");
  const sold = listings.filter((l) => l.status === "sold");
  const totalViews = listings.reduce((s, l) => s + l.views, 0);
  const inventoryValue = active.reduce((s, l) => s + l.priceCents * l.quantity, 0);

  const totalConversations = await prisma.thread.count({ where: { sellerId: user.id } });
  const unreadCount = await prisma.message.count({
    where: { senderId: { not: user.id }, readAt: null, thread: { sellerId: user.id } },
  });

  const isSeller = user.subscriptionStatus === "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Seller</p>
          <h1 className="font-display text-2xl font-extrabold text-white">Dashboard</h1>
        </div>
        {isSeller ? (
          <Link href="/sell" className="btn-primary">+ New listing</Link>
        ) : (
          <Link href="/subscribe" className="btn-accent">Become a seller</Link>
        )}
      </div>

      {/* Subscription banner */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-soft ${
          isSeller ? "bg-gradient-to-br from-brand-600 to-brand-800" : "bg-gradient-to-br from-slate-700 to-ink-900"
        }`}
      >
        <div className="tread absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isSeller ? "bg-emerald-400" : "bg-amber-400"}`} />
              <p className="font-display text-lg font-bold">
                {isSeller ? "Seller subscription active" : user.subscriptionStatus === "canceled" ? "Subscription canceled" : "Not subscribed"}
              </p>
            </div>
            <p className="mt-1 text-sm text-white/70">
              {isSeller
                ? user.subscriptionCurrentEnd
                  ? `$10/month · renews ${new Date(user.subscriptionCurrentEnd).toLocaleDateString()}`
                  : "$10/month seller plan"
                : "Subscribe to publish listings and message buyers."}
            </p>
          </div>
          {!isSeller && (
            <Link href="/subscribe" className="btn bg-white text-slate-900 hover:bg-slate-100">Subscribe — $10/mo</Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="blue" label="Listing views" value={totalViews}
          icon='<path d="M10 4C5 4 1.7 7.1 1 10c.7 2.9 4 6 9 6s8.3-3.1 9-6c-.7-2.9-4-6-9-6Zm0 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>' />
        <Stat tone="emerald" label="Active listings" value={active.length}
          icon='<path d="M3 4h14v3H3V4Zm0 5h14v7H3V9Zm2 2v3h4v-3H5Z"/>' />
        <Stat tone="amber" label={`Conversations${unreadCount ? "" : ""}`} value={totalConversations} sub={unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          icon='<path d="M3 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3v-3a1 1 0 0 1-1-1V5a1 1 0 0 1 0-1Z"/>' />
        <Stat tone="slate" label="Inventory value" value={formatPrice(inventoryValue)} small sub={`${sold.length} sold`}
          icon='<path d="M10 2 3 5v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V5l-7-3Z"/>' />
      </div>

      {/* Listings */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-white">Your listings</h2>
        {listings.length === 0 ? (
          <div className="card grid place-items-center px-6 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-2xl">🛞</span>
            <p className="mt-3 font-display font-bold text-slate-200">No tires listed yet</p>
            <p className="text-sm text-slate-400">Create your first listing to start selling.</p>
            {isSeller ? (
              <Link href="/sell" className="btn-primary mt-4">Create your first listing</Link>
            ) : (
              <Link href="/subscribe" className="btn-accent mt-4">Subscribe to start selling</Link>
            )}
          </div>
        ) : (
          <div className="card divide-y divide-white/5">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 transition hover:bg-white/5">
                <Link href={`/listings/${l.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                  {l.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photos[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🛞</div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/listings/${l.id}`} className="truncate font-display font-bold text-white hover:underline">
                      {l.brand} · {l.size}
                    </Link>
                    <span className={`badge ${l.status === "active" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30" : "bg-white/10 text-slate-300"}`}>
                      {l.status === "active" ? "Active" : "Sold"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    <span className="font-semibold text-slate-200">{formatPrice(l.priceCents)}</span> · Qty {l.quantity} · {timeAgo(l.createdAt)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                    <span>👁 {l.views} views</span>
                    <span>💬 {l._count.threads} chats</span>
                  </p>
                </div>
                <Link href={`/sell/${l.id}/edit`} className="btn-secondary shrink-0">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TONES = {
  blue: "from-brand-500 to-brand-700",
  emerald: "from-emerald-500 to-emerald-700",
  amber: "from-amber-500 to-amber-600",
  slate: "from-slate-600 to-slate-800",
};

function Stat({ label, value, icon, tone = "blue", sub, small }) {
  return (
    <div className="card p-4">
      <span className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${TONES[tone]} text-white`}>
        <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" dangerouslySetInnerHTML={{ __html: icon }} />
      </span>
      <p className={`font-display font-extrabold text-white ${small ? "text-xl" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs font-medium text-brand-300">{sub}</p>}
    </div>
  );
}
