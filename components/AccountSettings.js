"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountSettings() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Change password
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  // Log out everywhere
  const [loMsg, setLoMsg] = useState("");

  async function changePassword(e) {
    e.preventDefault();
    setPwErr(""); setPwMsg(""); setPwBusy(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password", current: cur, next }),
    });
    const data = await res.json().catch(() => ({}));
    setPwBusy(false);
    if (!res.ok) { setPwErr(data.error || "Couldn't update password."); return; }
    setCur(""); setNext(""); setPwMsg("Password updated. Other devices were signed out.");
  }

  async function logoutAll() {
    setLoMsg("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout-all" }),
    });
    if (res.ok) setLoMsg("Signed out of all other devices.");
  }

  async function del() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: delPw }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setErr(data.error || "Couldn't delete the account. Please try again.");
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-display font-bold text-white">Change password</h2>
        <form onSubmit={changePassword} className="mt-3 grid gap-3 sm:max-w-sm">
          <div>
            <label className="label" htmlFor="cur-pw">Current password</label>
            <input id="cur-pw" type="password" value={cur} onChange={(e) => setCur(e.target.value)} required className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="label" htmlFor="new-pw">New password</label>
            <input id="new-pw" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} className="input" placeholder="At least 6 characters" />
          </div>
          {pwErr && <p className="text-sm text-red-300">{pwErr}</p>}
          {pwMsg && <p className="text-sm text-emerald-300">{pwMsg}</p>}
          <button disabled={pwBusy} className="btn-primary justify-self-start">{pwBusy ? "Saving…" : "Update password"}</button>
        </form>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display font-bold text-white">Sessions</h2>
          <p className="mt-1 text-sm text-slate-400">Sign out everywhere except this device.</p>
          {loMsg && <p className="mt-1 text-sm text-emerald-300">{loMsg}</p>}
        </div>
        <button onClick={logoutAll} className="btn-secondary">Log out all devices</button>
      </div>

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
          This removes your account and hides your listings. You have <strong>7 days</strong> to recover it
          by logging back in; after that it's permanently deleted.
        </p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="btn-danger mt-3">Delete my account</button>
        ) : (
          <div className="mt-3 space-y-2">
            <label htmlFor="confirm-del" className="block text-sm text-red-100">Enter your password to confirm:</label>
            <input id="confirm-del" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} className="input max-w-xs" placeholder="••••••••" autoComplete="current-password" />
            {err && <p className="text-sm text-red-300">{err}</p>}
            <div className="flex gap-2">
              <button onClick={del} disabled={!delPw || busy} className="btn-danger">
                {busy ? "Deleting…" : "Delete account"}
              </button>
              <button onClick={() => { setConfirming(false); setDelPw(""); setErr(""); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
