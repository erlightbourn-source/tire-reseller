"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountSettings() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function del() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    setBusy(false);
    setErr("Couldn't delete the account. Please try again.");
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-display font-bold text-white">Your data</h2>
        <p className="mt-1 text-sm text-slate-400">
          Download everything we store about your account — profile, listings, favorites, saved searches,
          reviews, and the messages you've sent — as a JSON file.
        </p>
        {/* Direct link so the browser handles the file download. */}
        <a href="/api/account" className="btn-secondary mt-3 inline-flex">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M10 3v8m0 0 3-3m-3 3-3-3M4 15h12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Download my data
        </a>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="font-display font-bold text-red-200">Delete account</h2>
        <p className="mt-1 text-sm text-red-100/80">
          This permanently removes your account and everything tied to it — listings, messages, favorites,
          saved searches, and reviews. This cannot be undone.
        </p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="btn-danger mt-3">Delete my account</button>
        ) : (
          <div className="mt-3 space-y-2">
            <label htmlFor="confirm-del" className="block text-sm text-red-100">Type <span className="font-mono font-bold">DELETE</span> to confirm:</label>
            <input id="confirm-del" value={text} onChange={(e) => setText(e.target.value)} className="input max-w-xs" placeholder="DELETE" />
            {err && <p className="text-sm text-red-300">{err}</p>}
            <div className="flex gap-2">
              <button onClick={del} disabled={text !== "DELETE" || busy} className="btn-danger">
                {busy ? "Deleting…" : "Permanently delete"}
              </button>
              <button onClick={() => { setConfirming(false); setText(""); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
