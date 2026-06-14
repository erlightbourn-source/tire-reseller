"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

export default function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Couldn't reset your password."); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex items-center gap-2.5">
        <Logo className="h-9 w-9" />
        <span className="font-display text-xl font-extrabold text-white">Tire<span className="text-brand-400">Trader</span></span>
      </div>
      <div className="card p-6">
        <h1 className="font-display text-2xl font-bold text-white">Choose a new password</h1>
        {!token ? (
          <p className="mt-3 text-sm text-slate-400">
            This reset link is missing its token. <Link href="/forgot" className="font-semibold text-brand-300 hover:underline">Request a new one</Link>.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3.5">
            {err && (
              <div className="rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-300 ring-1 ring-inset ring-red-400/30">{err}</div>
            )}
            <div>
              <label className="label" htmlFor="reset-pw">New password</label>
              <input id="reset-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <button disabled={busy} className="btn-primary w-full">{busy ? "Saving…" : "Reset password"}</button>
            <p className="text-center text-xs text-slate-500">For your security, this signs you out of all other devices.</p>
          </form>
        )}
      </div>
    </div>
  );
}
