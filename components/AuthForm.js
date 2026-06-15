"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { STATES } from "@/lib/states";
import { track } from "@/lib/track";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "seller" ? "seller" : "buyer");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    if (isSignup) body.role = role;
    const res = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Something went wrong.");
      return;
    }
    if (isSignup) track("Signup", { role });
    // Sellers land on their dashboard; buyers on the marketplace.
    const dest =
      params.get("next") || (isSignup ? (role === "seller" ? "/dashboard" : "/") : "/");
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]">
      <div className="grid md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-8 text-white md:flex">
          <div className="mesh absolute inset-0" />
          <div className="tread absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="font-display text-xl font-extrabold">
              Tire<span className="text-brand-300">Trader</span>
            </span>
          </div>
          <div className="relative">
            <Logo className="mb-6 h-24 w-24" bare spin />
            <h2 className="font-display text-2xl font-bold leading-tight">
              {isSignup ? "Turn your tire stash into a business." : "Welcome back to the lot."}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Unlimited listings, built-in buyer messaging, and a real seller dashboard — for $10/month.
            </p>
          </div>
          <div className="relative flex gap-6 text-sm">
            <div><p className="font-display text-2xl font-extrabold">$10</p><p className="text-slate-400">per month</p></div>
            <div><p className="font-display text-2xl font-extrabold">∞</p><p className="text-slate-400">listings</p></div>
            <div><p className="font-display text-2xl font-extrabold">Free</p><p className="text-slate-400">to browse</p></div>
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-[#13161c] p-7 sm:p-9">
          <div className="mb-1 flex items-center gap-2 md:hidden">
            <Logo className="h-8 w-8" />
            <span className="font-display text-lg font-extrabold text-white">TireTrader</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {isSignup ? "Create your account" : "Log in"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isSignup
              ? "Buyers browse for free. Become a seller anytime."
              : "Manage your listings and messages."}
          </p>

          {err && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-300 ring-1 ring-red-400/30">
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current"><path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 11H9v-2h2v2Zm0-3H9V6h2v4Z"/></svg>
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
            {isSignup && (
              <div>
                <label className="label">I want to…</label>
                <div className="grid grid-cols-2 gap-2">
                  <RoleCard
                    active={role === "buyer"}
                    onClick={() => setRole("buyer")}
                    title="Buy tires"
                    sub="Browse & message — free"
                    icon="🔎"
                  />
                  <RoleCard
                    active={role === "seller"}
                    onClick={() => setRole("seller")}
                    title="Sell tires"
                    sub="1st year free, then $10/mo"
                    icon="🏷️"
                  />
                </div>
                {role === "seller" && (
                  <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0 fill-current"><path d="M8 13.2 4.8 10l-1.4 1.4L8 16l8-8-1.4-1.4Z"/></svg>
                    Your first year of selling is on us — $0 today, no card required.
                  </p>
                )}
              </div>
            )}
            {isSignup && (
              <div>
                <label className="label">Full name</label>
                <input name="name" required className="input" placeholder="Jordan Tires" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                {!isSignup && <Link href="/forgot" className="mb-1.5 text-xs font-medium text-brand-300 hover:underline">Forgot password?</Link>}
              </div>
              <input name="password" type="password" required minLength={6} className="input" placeholder="••••••••" />
            </div>
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City <span className="font-normal text-slate-400">(optional)</span></label>
                  <input name="location" className="input" placeholder="Dallas" />
                </div>
                <div>
                  <label className="label">Your state</label>
                  <select name="state" className="input" defaultValue="">
                    <option value="">Select…</option>
                    {STATES.map((s) => (
                      <option key={s.abbr} value={s.abbr}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <button disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          {!isSignup && (
            <div className="mt-4 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-slate-400 ring-1 ring-inset ring-white/10">
              <span className="font-semibold text-slate-300">Demo:</span> demo@tiretrader.test / demo1234
            </div>
          )}

          <p className="mt-5 text-center text-sm text-slate-400">
            {isSignup ? (
              <>Already have an account? <Link href="/login" className="font-semibold text-brand-300 hover:underline">Log in</Link></>
            ) : (
              <>New here? <Link href="/signup" className="font-semibold text-brand-300 hover:underline">Create an account</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, title, sub, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-brand-400/60 bg-brand-500/10 ring-2 ring-brand-500/30"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div className="text-lg">{icon}</div>
      <div className="mt-1 text-sm font-semibold text-white">{title}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </button>
  );
}
