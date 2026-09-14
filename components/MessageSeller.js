"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@/lib/track";
import { SAFETY_WARNING, detectOffPlatform } from "@/lib/safety";

export default function MessageSeller({ listingId, loggedIn }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("Hi! Is this set still available?");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!loggedIn) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-slate-400">Log in to message the seller and make an offer.</p>
        <a href={`/login?next=/listings/${listingId}`} className="btn-primary mt-3 w-full">Log in to message</a>
      </div>
    );
  }

  async function send() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, message: msg }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Could not start conversation.");
    track("Message seller");
    router.push(`/messages/${data.threadId}`);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full py-3 text-base">
        <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current"><path d="M3 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3v-3H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/></svg>
        Message seller
      </button>
    );
  }

  // Surface the standing anti-fraud warning in the composer (the moment a buyer
  // is most exposed to off-platform scams), and elevate it if the buyer's own
  // draft trips the off-platform detector. Advisory only — never blocks sending.
  const offPlatform = detectOffPlatform(msg);

  return (
    <div className="card space-y-2 p-4">
      {err && <div className="bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      <p className="text-sm font-semibold text-slate-200">Send a message</p>
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="input" />
      <div className={`px-3 py-2 text-xs ${offPlatform.flagged ? "bg-amber-500/15 text-amber-200" : "bg-slate-500/10 text-slate-400"}`}>
        {offPlatform.flagged && <span className="font-semibold">⚠ Keep this deal on TireTrader. </span>}
        {SAFETY_WARNING}
      </div>
      <label className="flex items-start gap-2 text-xs text-slate-300">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" />
        <span>I understand these tires are sold <span className="font-semibold text-slate-200">as-is by the seller</span> and I&apos;m buying at my own risk.{" "}
          <Link href="/terms" className="font-semibold text-brand-300 hover:text-brand-200">Terms</Link></span>
      </label>
      <div className="flex gap-2">
        <button onClick={send} disabled={busy || !ack} className="btn-primary flex-1">
          {busy ? "Sending…" : "Send message"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
