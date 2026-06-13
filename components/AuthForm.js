"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || (isSignup ? "/subscribe" : "/");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
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
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 shadow-lift">
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
        <div className="bg-white p-7 sm:p-9">
          <div className="mb-1 flex items-center gap-2 md:hidden">
            <Logo className="h-8 w-8" />
            <span className="font-display text-lg font-extrabold">TireTrader</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {isSignup ? "Create your account" : "Log in"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSignup
              ? "Buyers browse for free. Become a seller anytime."
              : "Manage your listings and messages."}
          </p>

          {err && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current"><path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 11H9v-2h2v2Zm0-3H9V6h2v4Z"/></svg>
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
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
              <label className="label">Password</label>
              <input name="password" type="password" required minLength={6} className="input" placeholder="••••••••" />
            </div>
            {isSignup && (
              <div>
                <label className="label">Location <span className="font-normal text-slate-400">(optional)</span></label>
                <input name="location" className="input" placeholder="Dallas, TX" />
              </div>
            )}
            <button disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          {!isSignup && (
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
              <span className="font-semibold text-slate-600">Demo:</span> demo@tiretrader.test / demo1234
            </div>
          )}

          <p className="mt-5 text-center text-sm text-slate-500">
            {isSignup ? (
              <>Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></>
            ) : (
              <>New here? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Create an account</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
