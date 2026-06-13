"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function SaveSearch({ params, router }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: params.toString() }),
    });
    setBusy(false);
    if (res.status === 401) return router.push("/login?next=/browse");
    if (res.ok) setSaved(true);
  }
  return (
    <button type="button" onClick={save} disabled={busy || saved} className="btn-ghost px-3 py-1.5">
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3-6 3V4a1 1 0 0 1 1-1Z"/></svg>
      {saved ? "Saved ✓" : "Save search"}
    </button>
  );
}

export default function SearchFilters({ brands }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [more, setMore] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  function apply(next) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    router.push(`${pathname}?${sp.toString()}`);
  }

  function onSearch(e) {
    e.preventDefault();
    apply({ q });
  }

  const sel = (k) => params.get(k) || "";
  const filterKeys = ["q", "brand", "condition", "size", "maxPrice", "sort", "season", "runFlat", "lat"];
  const anyFilter = filterKeys.some((k) => params.get(k));
  const nearActive = params.get("lat") && params.get("radius");

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        apply({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
          radius: params.get("radius") || "50",
          near: "me",
          state: "", // radius supersedes state scope
        });
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

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

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className={`btn ${nearActive ? "bg-brand-600 text-white" : "bg-white/5 text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10"} px-3 py-1.5`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M10 2a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 10 5a2.5 2.5 0 0 1 0 5.5Z"/></svg>
          {locating ? "Locating…" : nearActive ? "Near me ✓" : "Near me"}
        </button>
        {nearActive && (
          <select className="input w-auto py-1.5" value={sel("radius")} onChange={(e) => apply({ radius: e.target.value })}>
            <option value="25">25 mi</option>
            <option value="50">50 mi</option>
            <option value="100">100 mi</option>
            <option value="250">250 mi</option>
          </select>
        )}
        <button type="button" onClick={() => setMore((m) => !m)} className="btn-ghost px-3 py-1.5">
          {more ? "Fewer filters" : "More filters"}
        </button>
        <SaveSearch params={params} router={router} />
      </div>

      {more && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select className="input" value={sel("season")} onChange={(e) => apply({ season: e.target.value })}>
            <option value="">Any season</option>
            <option value="all-season">All-season</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
            <option value="all-weather">All-weather</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={params.get("runFlat") === "1"}
              onChange={(e) => apply({ runFlat: e.target.checked ? "1" : "" })}
              className="h-4 w-4 accent-brand-500"
            />
            Run-flat only
          </label>
        </div>
      )}

      {anyFilter && (
        <button
          onClick={() => {
            const state = params.get("state");
            router.push(state ? `${pathname}?state=${state}` : pathname);
          }}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-brand-300"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current"><path d="M4.3 4.3a1 1 0 0 1 1.4 0L8 6.6l2.3-2.3a1 1 0 1 1 1.4 1.4L9.4 8l2.3 2.3a1 1 0 0 1-1.4 1.4L8 9.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L6.6 8 4.3 5.7a1 1 0 0 1 0-1.4Z"/></svg>
          Clear all filters
        </button>
      )}
    </div>
  );
}
