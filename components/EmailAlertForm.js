"use client";
import { useState } from "react";
import { track } from "@/lib/track";

// Capture buyer demand without requiring an account: email me when matching
// tires are listed. `query` is the current browse querystring.
export default function EmailAlertForm({ query = "", compact = false }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/email-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, query }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong.");
    track("Email alert");
    setDone(true);
  }

  if (done) {
    return <p className="text-sm font-medium text-emerald-300">✓ We'll email you when matching tires are listed.</p>;
  }

  return (
    <form onSubmit={submit} className={`mx-auto flex w-full max-w-sm flex-col gap-2 sm:flex-row ${compact ? "" : "mt-2"}`}>
      <label htmlFor="alert-email" className="sr-only">Email for alerts</label>
      <input id="alert-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com" className="input" />
      <button disabled={busy} className="btn-primary shrink-0">{busy ? "…" : "Email me matches"}</button>
      {err && <p className="text-sm text-amber-300">{err}</p>}
    </form>
  );
}
