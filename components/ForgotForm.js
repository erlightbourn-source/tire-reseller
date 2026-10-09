"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useTurnstile } from "@/components/useTurnstile";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { ref: botRef, getToken } = useTurnstile();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const turnstileToken = await getToken();
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    // The reply never says whether an account exists, but a failed bot check or a
    // rate limit is not "sent", so show it instead of the confirmation.
    if (!res || res.status === 400 || res.status === 429) return setErr(data.error || "Something went wrong. Try again.");
    setSent(true);
    if (data.devLink) setDevLink(data.devLink);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex items-center gap-2.5">
        <Logo className="h-9 w-9" />
        <span className="font-display text-xl font-extrabold text-white">Tire<span className="text-brand-400">Kind</span></span>
      </div>
      <div className="card p-6">
        <h1 className="font-display text-2xl font-bold text-white">Reset your password</h1>
        {sent ? (
          <div className="mt-4 space-y-3">
            <div className="bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
              If an account exists for that email, we've sent a reset link. Check your inbox.
            </div>
            {devLink && (
              <div className="bg-white/5 p-3 text-xs text-slate-300 ring-1 ring-inset ring-white/10">
                <p className="mb-1 font-semibold text-slate-200">Dev mode (no email provider):</p>
                <a href={devLink} className="break-all font-mono text-brand-300 hover:underline">{devLink}</a>
              </div>
            )}
            <Link href="/login" className="btn-secondary w-full justify-center">Back to log in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3.5">
            <p className="text-sm text-slate-400">Enter your email and we'll send you a link to reset your password.</p>
            <div>
              <label className="label" htmlFor="forgot-email">Email</label>
              <input id="forgot-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            {err && <p className="text-sm text-amber-300" role="alert">{err}</p>}
            <div ref={botRef} />
            <button disabled={busy} className="btn-primary w-full">{busy ? "Sending…" : "Send reset link"}</button>
            <p className="text-center text-sm text-slate-400">
              Remembered it? <Link href="/login" className="font-semibold text-brand-300 hover:underline">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
