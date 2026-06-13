import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import ChatWindow from "@/components/ChatWindow";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/messages/${params.threadId}`);

  const thread = await prisma.thread.findUnique({
    where: { id: params.threadId },
    include: {
      listing: { include: { photos: { take: 1, orderBy: { sort: "asc" } } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });
  if (!thread) notFound();
  if (thread.buyerId !== user.id && thread.sellerId !== user.id) redirect("/messages");

  const other = thread.buyerId === user.id ? thread.seller : thread.buyer;
  const photo = thread.listing.photos[0]?.url;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/messages" className="text-sm text-brand-300 hover:underline">← All messages</Link>

      <Link href={`/listings/${thread.listing.id}`} className="card mt-2 flex items-center gap-3 p-3 transition hover:border-white/20">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xl">🛞</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{thread.listing.brand} · {thread.listing.size}</p>
          <p className="text-sm text-slate-400">{formatPrice(thread.listing.priceCents)} · with {other.name}</p>
        </div>
      </Link>

      <div className="mt-3">
        <ChatWindow threadId={thread.id} otherName={other.name} listingPrice={thread.listing.priceCents} />
      </div>
    </div>
  );
}
