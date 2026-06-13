"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchFilters({ brands }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  function apply(next) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    router.push(`/?${sp.toString()}#listings`);
  }

  function onSearch(e) {
    e.preventDefault();
    apply({ q });
  }

  const sel = (k) => params.get(k) || "";
  const anyFilter = ["q", "brand", "condition", "size", "maxPrice", "sort"].some((k) => params.get(k));

  return (
    <div className="card p-3 sm:p-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 fill-slate-400">
            <path d="M9 3a6 6 0 1 0 3.7 10.7l3.3 3.3 1.4-1.4-3.3-3.3A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, size (225/45R17), or location…"
            className="input pl-10"
          />
        </div>
        <button className="btn-primary px-5">Search</button>
      </form>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <select className="input" value={sel("brand")} onChange={(e) => apply({ brand: e.target.value })}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select className="input" value={sel("condition")} onChange={(e) => apply({ condition: e.target.value })}>
          <option value="">New &amp; Used</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>

        <input
          className="input"
          placeholder="Size e.g. R17"
          defaultValue={sel("size")}
          onBlur={(e) => apply({ size: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply({ size: e.currentTarget.value })}
        />

        <input
          className="input"
          placeholder="Max $"
          type="number"
          min="0"
          defaultValue={sel("maxPrice")}
          onBlur={(e) => apply({ maxPrice: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply({ maxPrice: e.currentTarget.value })}
        />

        <select className="input" value={sel("sort")} onChange={(e) => apply({ sort: e.target.value })}>
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {anyFilter && (
        <button
          onClick={() => router.push("/")}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-brand-300"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current"><path d="M4.3 4.3a1 1 0 0 1 1.4 0L8 6.6l2.3-2.3a1 1 0 1 1 1.4 1.4L9.4 8l2.3 2.3a1 1 0 0 1-1.4 1.4L8 9.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L6.6 8 4.3 5.7a1 1 0 0 1 0-1.4Z"/></svg>
          Clear all filters
        </button>
      )}
    </div>
  );
}
