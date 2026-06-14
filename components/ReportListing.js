"use client";
import { useState } from "react";

const REASONS = [
  ["spam", "Spam or duplicate"],
  ["scam", "Looks like a scam"],
  ["prohibited", "Prohibited / counterfeit"],
  ["wrong category", "Not tires / wrong category"],
  ["other", "Something else"],
];

export default function ReportListing({ listingId, loggedIn }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function report(reason) {
    setBusy(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, reason }),
    });
    setBusy(false);
    setOpen(false);
    if (res.status === 401) {
      window.location.href = `/login?next=/listings/${listingId}`;
      return;
    }
    if (res.ok) setDone(true);
  }

  if (done) return <p className="text-center text-xs text-slate-500">Thanks — our team will review this listing.</p>;

  if (!open) {
    return (
      <button onClick={() => (loggedIn ? setOpen(true) : (window.location.href = `/login?next=/listings/${listingId}`))} className="mx-auto block text-xs text-slate-500 hover:text-slate-300">
        ⚐ Report this listing
      </button>
    );
  }

  return (
    <div className="card p-3">
      <p className="mb-2 text-xs font-semibold text-slate-300">Why are you reporting this?</p>
      <div className="space-y-1">
        {REASONS.map(([val, label]) => (
          <button key={val} disabled={busy} onClick={() => report(val)} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-200 hover:bg-white/5">
            {label}
          </button>
        ))}
      </div>
      <button onClick={() => setOpen(false)} className="mt-1 px-2.5 text-xs text-slate-500 hover:text-slate-300">Cancel</button>
    </div>
  );
}
