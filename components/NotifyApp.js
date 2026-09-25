"use client";
import { useId, useState } from "react";
import { track } from "@/lib/track";

// App-launch waitlist on /app. Posts to /api/newsletter (MailerLite "TireKind —
// Subscribers", double opt-in), the same list as the footer signup, so nobody is
// added until they confirm. `company` is a honeypot: hidden from people, bots fill it.
export default function NotifyApp() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
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
      body: JSON.stringify({ email, company }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) return setErr(data.error || "Something went wrong.");
    track("Newsletter signup", { source: "app-waitlist" });
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
        ✓ Almost done. Check your inbox and confirm, then we'll email you when the app launches.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">Email for the TireKind app launch</label>
        <input
          id={inputId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="input"
        />
        <input
          type="text"
          name="company"
          data-lpignore="true"
          data-1p-ignore="true"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
        />
        <button disabled={busy} className="btn-primary whitespace-nowrap px-5">{busy ? "…" : "Notify me"}</button>
      </form>
      {err && <p className="mt-1.5 text-sm text-amber-300">{err}</p>}
      <p className="mt-1.5 text-xs text-slate-400">
        We'll email you when the app launches, plus occasional TireKind news. Unsubscribe anytime. See our{" "}
        <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
      </p>
    </div>
  );
}
