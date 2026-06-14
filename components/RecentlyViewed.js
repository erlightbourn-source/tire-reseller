"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

export default function RecentlyViewed({ exclude }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("tt_recently_viewed") || "[]");
      setItems(all.filter((x) => x.id !== exclude).slice(0, 8));
    } catch {}
  }, [exclude]);

  if (items.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-200">Recently viewed</p>
        <button
          onClick={() => { localStorage.removeItem("tt_recently_viewed"); setItems([]); }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Clear
        </button>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {items.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="w-32 shrink-0">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-900 ring-1 ring-white/10">
              {l.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl text-slate-600">◎</div>
              )}
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-white">{l.brand}</p>
            <p className="text-xs text-slate-400">{formatPrice(l.priceCents)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
