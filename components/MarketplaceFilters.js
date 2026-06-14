"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { stateName } from "@/lib/states";
import { seasonLabel } from "@/lib/tire";

// Keys that count as "active filters" for chips + the result count.
const CHIP_KEYS = ["q", "brand", "condition", "size", "maxPrice", "minTread", "minYear", "qty", "season", "runFlat", "near"];

export default function MarketplaceFilters({ brands, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => { setQ(params.get("q") || ""); }, [params]);
  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const apply = useCallback((next) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    router.push(`${pathname}?${sp.toString()}`);
  }, [params, pathname, router]);

  const sel = (k) => params.get(k) || "";
  const nearActive = params.get("lat") && params.get("radius");
  const activeCount = CHIP_KEYS.filter((k) => (k === "near" ? nearActive : params.get(k))).length;

  // Build removable chips from the current params.
  const chips = [];
  if (params.get("q")) chips.push({ key: "q", label: `“${params.get("q")}”`, clear: { q: "" } });
  if (params.get("brand")) chips.push({ key: "brand", label: params.get("brand"), clear: { brand: "" } });
  if (params.get("condition")) chips.push({ key: "condition", label: params.get("condition") === "new" ? "New" : "Used", clear: { condition: "" } });
  if (params.get("size")) chips.push({ key: "size", label: params.get("size"), clear: { size: "" } });
  if (params.get("maxPrice")) chips.push({ key: "maxPrice", label: `Under $${params.get("maxPrice")}`, clear: { maxPrice: "" } });
  if (params.get("minTread")) chips.push({ key: "minTread", label: `${params.get("minTread")}/32"+ tread`, clear: { minTread: "" } });
  if (params.get("minYear")) chips.push({ key: "minYear", label: `${params.get("minYear")}+ DOT`, clear: { minYear: "" } });
  if (params.get("qty")) chips.push({ key: "qty", label: `${params.get("qty")}+ tires`, clear: { qty: "" } });
  if (params.get("season")) chips.push({ key: "season", label: seasonLabel(params.get("season")), clear: { season: "" } });
  if (params.get("runFlat") === "1") chips.push({ key: "runFlat", label: "Run-flat", clear: { runFlat: "" } });
  if (nearActive) chips.push({ key: "near", label: `Within ${params.get("radius")} mi`, clear: { lat: "", lng: "", radius: "", near: "" } });

  function clearAll() {
    const state = params.get("state");
    router.push(state ? `${pathname}?state=${state}` : pathname);
  }

  function onSearch(e) {
    e.preventDefault();
    apply({ q });
    setDrawer(false);
  }

  const formProps = { apply, sel, params, brands, router, pathname, setDrawer };

  return (
    <>
      {/* Mobile sticky search + filter bar */}
      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-white/10 bg-ink-950/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 fill-slate-400" aria-hidden="true">
              <path d="M9 3a6 6 0 1 0 3.7 10.7l3.3 3.3 1.4-1.4-3.3-3.3A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
            </svg>
            <label htmlFor="m-search" className="sr-only">Search tires</label>
            <input id="m-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search size or brand" className="input pl-10" />
          </div>
          <button type="button" onClick={() => setDrawer(true)} className="btn-secondary relative shrink-0" aria-label="Open filters">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M3 5h14v2H3V5Zm3 4h8v2H6V9Zm2 4h4v2H8v-2Z"/></svg>
            Filters
            {activeCount > 0 && <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
          </button>
        </form>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.key} onClick={() => apply(c.clear)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-brand-400/30 transition hover:bg-brand-500/25" aria-label={`Remove filter ${c.label}`}>
              {c.label}
              <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden="true"><path d="M4.3 4.3a1 1 0 0 1 1.4 0L8 6.6l2.3-2.3a1 1 0 1 1 1.4 1.4L9.4 8l2.3 2.3a1 1 0 0 1-1.4 1.4L8 9.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L6.6 8 4.3 5.7a1 1 0 0 1 0-1.4Z"/></svg>
            </button>
          ))}
          <button onClick={clearAll} className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-brand-300 hover:underline">Clear all</button>
        </div>
      )}

      {/* Two-column layout: sticky sidebar + results */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <FilterForm {...formProps} desktop />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-ink-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-display text-lg font-bold text-white">Filters</p>
              <button onClick={() => setDrawer(false)} className="btn-ghost px-3 py-1.5" aria-label="Close filters">Done</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterForm {...formProps} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterForm({ apply, sel, params, brands, router, pathname, setDrawer, desktop }) {
  const [q, setQ] = useState(params.get("q") || "");
  const [locating, setLocating] = useState(false);
  const nearActive = params.get("lat") && params.get("radius");

  useEffect(() => { setQ(params.get("q") || ""); }, [params]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        apply({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4), radius: params.get("radius") || "50", near: "me", state: "" });
        setDrawer?.(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={useMyLocation} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold ring-1 ring-inset transition ${nearActive ? "bg-brand-600 text-white ring-brand-400" : "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10"}`}>
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M10 2a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 10 5a2.5 2.5 0 0 1 0 5.5Z"/></svg>
          {locating ? "…" : "Near me"}
        </button>
        <Link href="/states" className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-2 py-2.5 text-center text-[11px] font-semibold text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M10 2 3 6v12h5v-5h4v5h5V6l-7-4Z"/></svg>
          Change state
        </Link>
        <Link href="/states" className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-2 py-2.5 text-center text-[11px] font-semibold text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M3 11l2-5h10l2 5v4h-2a2 2 0 1 1-4 0H7a2 2 0 1 1-4 0H3v-4Zm3-4-1 3h10l-1-3H6Z"/></svg>
          By vehicle
        </Link>
      </div>

      {nearActive && (
        <Field label="Search radius">
          <select className="input" value={sel("radius")} onChange={(e) => apply({ radius: e.target.value })}>
            <option value="25">25 miles</option>
            <option value="50">50 miles</option>
            <option value="100">100 miles</option>
            <option value="250">250 miles</option>
          </select>
        </Field>
      )}

      {desktop && (
        <Field label="Search">
          <form onSubmit={(e) => { e.preventDefault(); apply({ q }); }} className="relative">
            <label htmlFor="d-search" className="sr-only">Search tires</label>
            <input id="d-search" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => apply({ q })} placeholder="Size, brand, location…" className="input" />
          </form>
        </Field>
      )}

      <Field label="Sort by">
        <select className="input" value={sel("sort")} onChange={(e) => apply({ sort: e.target.value })}>
          <option value="">Newest first</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </Field>

      <Field label="Condition">
        <div className="grid grid-cols-3 gap-1.5">
          {[["", "All"], ["new", "New"], ["used", "Used"]].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => apply({ condition: val })}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${sel("condition") === val ? "bg-brand-600 text-white ring-brand-400" : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10"}`}>
              {lbl}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Brand">
        <select className="input" value={sel("brand")} onChange={(e) => apply({ brand: e.target.value })}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>

      <Field label="Tire size">
        <input className="input" placeholder="e.g. 225/45R17 or R17" defaultValue={sel("size")}
          onBlur={(e) => apply({ size: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply({ size: e.currentTarget.value }))} />
      </Field>

      <Field label="Max price">
        <input className="input" type="number" min="0" placeholder="Any" defaultValue={sel("maxPrice")}
          onBlur={(e) => apply({ maxPrice: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply({ maxPrice: e.currentTarget.value }))} />
      </Field>

      <Field label="Min tread depth">
        <select className="input" value={sel("minTread")} onChange={(e) => apply({ minTread: e.target.value })}>
          <option value="">Any tread</option>
          <option value="4">4/32" or more</option>
          <option value="6">6/32" or more</option>
          <option value="8">8/32" or more</option>
        </select>
      </Field>

      <Field label="Min DOT year">
        <select className="input" value={sel("minYear")} onChange={(e) => apply({ minYear: e.target.value })}>
          <option value="">Any year</option>
          <option value="2020">2020 or newer</option>
          <option value="2021">2021 or newer</option>
          <option value="2022">2022 or newer</option>
          <option value="2023">2023 or newer</option>
        </select>
      </Field>

      <Field label="Quantity">
        <select className="input" value={sel("qty")} onChange={(e) => apply({ qty: e.target.value })}>
          <option value="">Any quantity</option>
          <option value="2">2 or more</option>
          <option value="4">Full set (4+)</option>
        </select>
      </Field>

      <Field label="Season">
        <select className="input" value={sel("season")} onChange={(e) => apply({ season: e.target.value })}>
          <option value="">Any season</option>
          <option value="all-season">All-season</option>
          <option value="summer">Summer</option>
          <option value="winter">Winter</option>
          <option value="all-weather">All-weather</option>
        </select>
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-200">
        <input type="checkbox" checked={params.get("runFlat") === "1"} onChange={(e) => apply({ runFlat: e.target.checked ? "1" : "" })} className="h-4 w-4 accent-brand-500" />
        Run-flat only
      </label>

      <SaveSearch params={params} router={router} pathname={pathname} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  );
}

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
    <button type="button" onClick={save} disabled={busy || saved} className="btn-secondary w-full justify-center">
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3-6 3V4a1 1 0 0 1 1-1Z"/></svg>
      {saved ? "Search saved ✓" : "Save this search"}
    </button>
  );
}
