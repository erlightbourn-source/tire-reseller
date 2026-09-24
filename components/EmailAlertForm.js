"use client";
import { useId, useState } from "react";
import { track } from "@/lib/track";

// Capture buyer demand without requiring an account: email me when matching
// tires are listed. `query` is the current browse querystring.
export default function EmailAlertForm({ query = "", compact = false }) {
  // Unique per instance so multiple forms on one page can't collide on the id.
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Separate, unchecked-by-default consent: alerts are not marketing mail.
  const [news, setNews] = useState(false);

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
    if (news) {
      // Best effort: the alert already succeeded, so a newsletter hiccup must not undo it.
      const nr = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => null);
      if (nr && nr.ok) track("Newsletter signup", { source: "alerts" });
    }
    setDone(true);
  }

  if (done) {
    return <p className="text-sm font-medium text-emerald-300">✓ Check your email to confirm — then we'll alert you when matching tires are listed.</p>;
  }

  return (
    <div className={`mx-auto w-full max-w-sm ${compact ? "" : "mt-2"}`}>
      <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">Email for alerts</label>
        <input id={inputId} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" className="input" />
        <button disabled={busy} className="btn-primary shrink-0">{busy ? "…" : "Email me matches"}</button>
      </form>
      {err && <p className="mt-1.5 text-sm text-amber-300">{err}</p>}
      <p className="mt-1.5 text-xs text-slate-400">One email when tires match. No account needed, unsubscribe anytime.</p>
      <label className={`mt-2 flex items-start gap-2 text-xs text-slate-400 ${compact ? "" : "justify-center"}`}>
        <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} className="mt-0.5" />
        <span>Also send me TireKind news (occasional, separate list).</span>
      </label>
    </div>
  );
}
