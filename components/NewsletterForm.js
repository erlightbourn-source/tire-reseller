"use client";
import { useId, useState } from "react";
import { track } from "@/lib/track";

// TireKind news signup (MailerLite, double opt-in via /api/newsletter).
// `source` labels where the signup came from for analytics ("footer", "home").
export default function NewsletterForm({ source = "footer", compact = false }) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) return setErr(data.error || "Something went wrong.");
    track("Newsletter signup", { source });
    setDone(true);
  }

  if (done) {
    return <p className="text-sm font-medium text-emerald-300">✓ Almost done. Check your inbox and confirm to get TireKind news.</p>;
  }

  return (
    <div className={`w-full max-w-sm ${compact ? "" : "mx-auto mt-2"}`}>
      <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">Email for TireKind news</label>
        <input id={inputId} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" className="input" />
        <button disabled={busy} className="btn-primary shrink-0">{busy ? "…" : "Sign up"}</button>
      </form>
      {err && <p className="mt-1.5 text-sm text-amber-300">{err}</p>}
      <p className="mt-1.5 text-xs text-slate-400">
        Occasional emails about new local listings and selling tips. Unsubscribe anytime. See our{" "}
        <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
      </p>
    </div>
  );
}
