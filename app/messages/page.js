import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");

  const threads = await prisma.thread.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { include: { photos: { take: 1, orderBy: { sort: "asc" } } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: true },
      },
    },
  });

  // unread counts
  const unreadRows = await prisma.message.groupBy({
    by: ["threadId"],
    where: { senderId: { not: user.id }, readAt: null, thread: { OR: [{ buyerId: user.id }, { sellerId: user.id }] } },
    _count: { _all: true },
  });
  const unread = Object.fromEntries(unreadRows.map((r) => [r.threadId, r._count._all]));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <p className="eyebrow">Inbox</p>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Messages</h1>
      </div>
      {threads.length === 0 ? (
        <div className="card grid place-items-center px-6 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">💬</span>
          <p className="mt-3 font-display font-bold text-slate-700">No conversations yet</p>
          <p className="text-sm text-slate-500">Message a seller from any listing to start chatting.</p>
          <Link href="/" className="btn-secondary mt-4">Browse tires</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const other = t.buyerId === user.id ? t.seller : t.buyer;
            const role = t.buyerId === user.id ? "Seller" : "Buyer";
            const last = t.messages[0];
            const photo = t.listing.photos[0]?.url;
            return (
              <Link key={t.id} href={`/messages/${t.id}`} className="card flex items-center gap-3 p-3 hover:shadow-md">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🛞</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{t.listing.brand} · {t.listing.size}</p>
                    <span className="whitespace-nowrap text-xs text-slate-400">{timeAgo(t.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{role}: {other.name} · {formatPrice(t.listing.priceCents)}</p>
                  <p className="truncate text-sm text-slate-500">{last ? last.body : "No messages yet"}</p>
                </div>
                {unread[t.id] > 0 && (
                  <span className="badge bg-brand-600 text-white">{unread[t.id]}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
