"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MAKES, modelsFor, yearsFor, sizeFor } from "@/lib/fitment";

const TABS = [
  { key: "size", label: "By tire size" },
  { key: "vehicle", label: "By vehicle" },
  { key: "near", label: "Near me" },
];

export default function HeroSearch({ homeState }) {
  const router = useRouter();
  const [tab, setTab] = useState("size");

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/70 p-2 shadow-lift backdrop-blur">
      <div role="tablist" aria-label="Find tires" className="flex gap-1 rounded-xl bg-black/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-white text-ink-950 shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3">
        {tab === "size" && <SizeSearch router={router} homeState={homeState} />}
        {tab === "vehicle" && <VehicleSearch router={router} homeState={homeState} />}
        {tab === "near" && <NearSearch router={router} homeState={homeState} />}
      </div>
    </div>
  );
}

function SizeSearch({ router, homeState }) {
  const [size, setSize] = useState("");
  function go(e) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (size.trim()) sp.set("q", size.trim());
    if (homeState) sp.set("state", homeState);
    router.push(`/browse${sp.toString() ? `?${sp}` : ""}`);
  }
  return (
    <form onSubmit={go} className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 fill-slate-400" aria-hidden="true">
          <path d="M9 3a6 6 0 1 0 3.7 10.7l3.3 3.3 1.4-1.4-3.3-3.3A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
        </svg>
        <label htmlFor="hero-size" className="sr-only">Tire size or brand</label>
        <input
          id="hero-size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Enter a size like 225/45R17 or a brand"
          className="input pl-10 text-base"
        />
      </div>
      <button className="btn-primary px-6 text-base">Search tires</button>
    </form>
  );
}

function VehicleSearch({ router, homeState }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const models = make ? modelsFor(make) : [];
  const years = make && model ? yearsFor(make, model) : [];
  const size = make && model && year ? sizeFor(make, model, year) : null;

  function go() {
    if (!size) return;
    const sp = new URLSearchParams({ size, fits: `${year} ${make} ${model}` });
    if (homeState) sp.set("state", homeState);
    router.push(`/browse?${sp}`);
  }
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-4">
        <select aria-label="Make" className="input" value={make}
          onChange={(e) => { setMake(e.target.value); setModel(""); setYear(""); }}>
          <option value="">Make</option>
          {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Model" className="input" value={model} disabled={!make}
          onChange={(e) => { setModel(e.target.value); setYear(""); }}>
          <option value="">Model</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Year" className="input" value={year} disabled={!model}
          onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={go} disabled={!size} className="btn-primary">
          {size ? `Find ${size}` : "Find tires"}
        </button>
      </div>
      {size && (
        <p className="mt-2 text-sm text-slate-400">
          Your {year} {make} {model} uses <span className="font-mono font-semibold text-brand-300">{size}</span>.
        </p>
      )}
    </div>
  );
}

function NearSearch({ router, homeState }) {
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");

  function useLocation() {
    if (!navigator.geolocation) { setErr("Location isn't available on this device."); return; }
    setLocating(true);
    setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const sp = new URLSearchParams({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
          radius: "50",
          near: "me",
        });
        router.push(`/browse?${sp}`);
      },
      () => { setLocating(false); setErr("Couldn't get your location. Try browsing by state."); },
      { timeout: 8000 }
    );
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button onClick={useLocation} disabled={locating} className="btn-primary px-5">
        <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M10 2a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 10 5a2.5 2.5 0 0 1 0 5.5Z"/></svg>
        {locating ? "Locating…" : "Use my location"}
      </button>
      <span className="text-sm text-slate-400">
        or{" "}
        <Link href={homeState ? `/browse?state=${homeState}` : "/states"} className="font-semibold text-brand-300 hover:text-brand-200">
          {homeState ? "browse your state" : "pick your state on the map"}
        </Link>
      </span>
      {err && <p className="text-sm text-amber-300">{err}</p>}
    </div>
  );
}
