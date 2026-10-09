"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PLACEHOLDER = `Michelin | 225/45R17 | 320 | 4 | used | Dallas, TX | 7/32 | 2022
Goodyear | 265/70R17 | 540 | 4 | new | Austin, TX | 11/32 | 2025
Bridgestone | 205/55R16 | 260 | 4 | used | Houston, TX | 6/32 | 2021`;

export default function BulkAdd() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    setResult(null);
    const res = await fetch("/api/listings/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      if (data.code === "pro_required") return router.push("/pro");
      return setErr(data.error || "Could not add listings.");
    }
    setResult(data);
    setText("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        One listing per line: <code className="bg-white/5 px-1 text-slate-300">Brand | Size | Price | Qty | new/used | City, ST | Tread depth | DOT year</code>
      </p>
      <p className="text-xs text-slate-500">
        Tread depth in 32nds (e.g. 7/32). DOT year from the sidewall: the last two of the 4 digits after "DOT" (2321 = 2021). Both are required.
      </p>
      {err && <div className="bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {result && (
        <div className="bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Added {result.count} listing{result.count !== 1 ? "s" : ""}.
          {result.errors?.length ? ` Skipped ${result.errors.length} line(s).` : ""}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="input font-mono text-sm"
        placeholder={PLACEHOLDER}
      />
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !text.trim()} className="btn-primary">{busy ? "Adding…" : "Add all"}</button>
        <a href="/dashboard" className="btn-secondary">Done</a>
      </div>
    </div>
  );
}
