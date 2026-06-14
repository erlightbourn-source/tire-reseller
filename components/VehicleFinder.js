"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAKES, modelsFor, trimsFor, yearsFor, fitmentFor } from "@/lib/fitment";

export default function VehicleFinder({ stateParam }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [year, setYear] = useState("");

  const models = make ? modelsFor(make) : [];
  const trims = make && model ? trimsFor(make, model) : [];
  const years = make && model && trim ? yearsFor(make, model, trim) : [];
  const fit = make && model && trim && year ? fitmentFor(make, model, trim, year) : null;

  function go(size) {
    if (!size) return;
    const sp = new URLSearchParams();
    sp.set("size", size);
    if (stateParam) sp.set("state", stateParam);
    sp.set("fits", `${year} ${make} ${model} ${trim}`);
    router.push(`/browse?${sp.toString()}`);
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-3">
        <p className="eyebrow">Not sure of your size?</p>
        <h3 className="font-display text-lg font-bold text-white">Find tires for your vehicle</h3>
      </div>
      <div className="grid gap-2 p-4 pb-0 sm:grid-cols-2 lg:grid-cols-4">
        <select aria-label="Make" className="input" value={make}
          onChange={(e) => { setMake(e.target.value); setModel(""); setTrim(""); setYear(""); }}>
          <option value="">Make</option>
          {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Model" className="input" value={model} disabled={!make}
          onChange={(e) => { setModel(e.target.value); setTrim(""); setYear(""); }}>
          <option value="">Model</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Trim" className="input" value={trim} disabled={!model}
          onChange={(e) => { setTrim(e.target.value); setYear(""); }}>
          <option value="">Trim</option>
          {trims.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Year" className="input" value={year} disabled={!trim} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4">
        {fit?.staggered ? (
          <>
            <button onClick={() => go(fit.front)} className="btn-primary">Front {fit.front}</button>
            <button onClick={() => go(fit.rear)} className="btn-secondary">Rear {fit.rear}</button>
            <span className="text-sm text-slate-400">
              Staggered — your {year} {make} {model} {trim} runs
              <span className="font-mono font-semibold text-brand-300"> {fit.front}</span> front /
              <span className="font-mono font-semibold text-brand-300"> {fit.rear}</span> rear.
            </span>
          </>
        ) : (
          <>
            <button onClick={() => go(fit?.front)} disabled={!fit} className="btn-primary">
              {fit ? `Find ${fit.front}` : "Find tires"}
            </button>
            {fit && (
              <span className="text-sm text-slate-400">
                Your {year} {make} {model} {trim} uses <span className="font-mono font-semibold text-brand-300">{fit.front}</span>.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
