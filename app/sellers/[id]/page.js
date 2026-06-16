import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import Stars from "@/components/Stars";
import ReviewForm from "@/components/ReviewForm";
import BlockSeller from "@/components/BlockSeller";

export const dynamic = "force-dynamic";

const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default async function SellerProfile({ params }) {
  const { id } = await params;
  const me = await getCurrentUser();
  const seller = await prisma.user.findUnique({
    where: { id },
    include: {
      listings: {
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: { photos: { take: 1, orderBy: { sort: "asc" } } },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      _count: { select: { listings: true } },
    },
  });
  if (!seller || seller.role !== "seller") notFound();

  const reviews = seller.reviewsReceived;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const soldCount = await prisma.listing.count({ where: { sellerId: seller.id, status: "sold" } });
  const myReview = me ? reviews.find((r) => r.authorId === me.id) : null;
  const canReview = me && me.id !== seller.id;
  const iBlock = me && me.id !== seller.id
    ? !!(await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: me.id, blockedId: seller.id } } }))
    : false;

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
          {initials(seller.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold text-white">{seller.name}</h1>
            {seller.pro && <span className="badge bg-gradient-to-r from-amber-400 to-accent-500 text-ink-950">PRO</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Stars value={avg} />
            <span className="font-semibold text-slate-200">{avg ? avg.toFixed(1) : "—"}</span>
            <span>({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            {seller.location && <span>· 📍 {seller.location}</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {seller.listings.length} active · {soldCount} sold · Member since {new Date(seller.createdAt).getFullYear()}
          </p>
        </div>
        {me && me.id !== seller.id && <BlockSeller sellerId={seller.id} initial={iBlock} />}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-white">Active listings ({seller.listings.length})</h2>
        {seller.listings.length === 0 ? (
          <div className="card px-6 py-10 text-center text-sm text-slate-400">No active listings right now.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {seller.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-white">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="card px-6 py-8 text-center text-sm text-slate-400">No reviews yet.</div>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{r.author.name}</span>
                    <Stars value={r.rating} size="h-3.5 w-3.5" />
                  </div>
                  {r.body && <p className="mt-1 text-sm text-slate-400">{r.body}</p>}
                  <p className="mt-1 text-xs text-slate-500">{timeAgo(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {canReview ? (
            <ReviewForm sellerId={seller.id} existing={myReview} />
          ) : (
            <div className="card p-4 text-sm text-slate-400">
              {me ? "This is your seller profile." : <>Log in to leave a review — <Link href="/login" className="font-semibold text-brand-300">log in</Link>.</>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
