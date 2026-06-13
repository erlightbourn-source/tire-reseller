"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAKES, modelsFor, yearsFor, sizeFor } from "@/lib/fitment";

export default function VehicleFinder({ stateParam }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const models = make ? modelsFor(make) : [];
  const years = make && model ? yearsFor(make, model) : [];
  const size = make && model && year ? sizeFor(make, model, year) : null;

  function go() {
    if (!size) return;
    const sp = new URLSearchParams();
    sp.set("size", size);
    if (stateParam) sp.set("state", stateParam);
    sp.set("fits", `${year} ${make} ${model}`);
    router.push(`/browse?${sp.toString()}`);
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-3">
        <p className="eyebrow">Not sure of your size?</p>
        <h3 className="font-display text-lg font-bold text-white">Find tires for your vehicle</h3>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-4">
        <select
          className="input"
          value={make}
          onChange={(e) => { setMake(e.target.value); setModel(""); setYear(""); }}
        >
          <option value="">Make</option>
          {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          className="input"
          value={model}
          disabled={!make}
          onChange={(e) => { setModel(e.target.value); setYear(""); }}
        >
          <option value="">Model</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input" value={year} disabled={!model} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={go} disabled={!size} className="btn-primary">
          {size ? `Find ${size}` : "Find tires"}
        </button>
      </div>
      {size && (
        <div className="px-4 pb-4 text-sm text-slate-400">
          Your {year} {make} {model} uses <span className="font-mono font-semibold text-brand-300">{size}</span>.
        </div>
      )}
    </div>
  );
}
