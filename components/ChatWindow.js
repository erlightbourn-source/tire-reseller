"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { detectOffPlatform, SAFETY_WARNING } from "@/lib/safety";

const money = (c) => "$" + (c / 100).toLocaleString("en-US");
const OFFER_TTL_MS = 48 * 60 * 60 * 1000;
function offerExpiry(m) {
  const left = OFFER_TTL_MS - (Date.now() - new Date(m.createdAt).getTime());
  if (left <= 0) return { expired: true, label: "Expired" };
  const h = Math.floor(left / 3.6e6);
  return { expired: false, label: h >= 1 ? `Expires in ${h}h` : "Expires soon" };
}

export default function ChatWindow({ threadId, otherName, listingPrice }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState(listingPrice ? Math.round(listingPrice / 100) : "");
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/${threadId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setLoaded(true);
    }
  }, [threadId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const body = text.trim();
    setText("");
    await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    load();
  }

  async function sendOffer() {
    const cents = Math.round(Number(offer) * 100);
    if (!cents || cents <= 0) return;
    setOfferOpen(false);
    await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "offer", offerCents: cents }),
    });
    load();
  }

  const [counterFor, setCounterFor] = useState(null);
  const [counterAmt, setCounterAmt] = useState("");

  async function respond(messageId, action, cents) {
    await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action, offerCents: cents }),
    });
    setCounterFor(null);
    load();
  }

  let lastDay = null;
  const risky = messages.some((m) => m.kind !== "offer" && detectOffPlatform(m.body).flagged);

  return (
    <div className="card flex h-[62vh] flex-col overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto bg-black/20 p-4">
        {loaded && messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-500">Start the conversation with {otherName}.</p>
        )}
        {messages.map((m) => {
          const day = new Date(m.createdAt).toLocaleDateString();
          const showDay = day !== lastDay;
          lastDay = day;
          const isOffer = m.kind === "offer";
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white/5 px-3 py-0.5 text-xs text-slate-400 ring-1 ring-white/10">{day}</span>
                </div>
              )}
              <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                {isOffer ? (
                  (() => {
                    const exp = offerExpiry(m);
                    const live = m.offerStatus === "pending" && !exp.expired;
                    return (
                  <div className={`max-w-[80%] rounded-2xl border p-3 ${m.offerStatus === "accepted" ? "border-emerald-400/40 bg-emerald-500/10" : (m.offerStatus === "declined" || m.offerStatus === "countered" || exp.expired) ? "border-white/10 bg-white/5 opacity-70" : "border-accent-400/40 bg-accent-500/10"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-300">{m.mine ? "Your offer" : "Offer"}</p>
                    <p className="font-display text-2xl font-extrabold text-white">{money(m.offerCents)}</p>
                    {m.offerStatus === "accepted" && <p className="text-xs font-semibold text-emerald-300">✓ Accepted</p>}
                    {m.offerStatus === "declined" && <p className="text-xs text-slate-400">Declined</p>}
                    {m.offerStatus === "countered" && <p className="text-xs text-slate-400">Countered</p>}
                    {live && <p className="text-[10px] text-slate-400">{exp.label}</p>}
                    {m.offerStatus === "pending" && exp.expired && <p className="text-xs text-slate-400">Expired</p>}
                    {live && !m.mine && counterFor !== m.id && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button onClick={() => respond(m.id, "accept")} className="btn bg-emerald-500 px-3 py-1 text-xs text-ink-950 hover:bg-emerald-400">Accept</button>
                        <button onClick={() => { setCounterFor(m.id); setCounterAmt(Math.round(m.offerCents / 100)); }} className="btn bg-brand-600 px-3 py-1 text-xs text-white hover:bg-brand-500">Counter</button>
                        <button onClick={() => respond(m.id, "decline")} className="btn bg-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/20">Decline</button>
                      </div>
                    )}
                    {live && !m.mine && counterFor === m.id && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs text-slate-300">$</span>
                        <input type="number" value={counterAmt} onChange={(e) => setCounterAmt(e.target.value)} className="input max-w-[100px] py-1 text-sm" />
                        <button onClick={() => respond(m.id, "counter", Math.round(Number(counterAmt) * 100))} className="btn bg-brand-600 px-3 py-1 text-xs text-white">Send</button>
                        <button onClick={() => setCounterFor(null)} className="btn-ghost px-2 py-1 text-xs">✕</button>
                      </div>
                    )}
                    {live && m.mine && <p className="text-xs text-slate-400">Waiting for a response…</p>}
                    <div className="mt-1 text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                    );
                  })()
                ) : (
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white/[0.07] text-slate-100 ring-1 ring-white/10"}`}>
                    {m.body}
                    <div className={`mt-0.5 text-[10px] ${m.mine ? "text-brand-100" : "text-slate-500"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {risky && (
        <div className="flex items-start gap-2 border-t border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 fill-amber-300" aria-hidden="true"><path d="M10 1 1 18h18L10 1Zm0 6 .9 6h-1.8L10 7Zm0 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>
          <span><strong>Safety tip:</strong> {SAFETY_WARNING}</span>
        </div>
      )}

      {offerOpen && (
        <div className="flex items-center gap-2 border-t border-white/10 bg-accent-500/5 p-3">
          <span className="text-sm text-slate-300">Offer $</span>
          <input type="number" min="1" value={offer} onChange={(e) => setOffer(e.target.value)} className="input max-w-[140px]" />
          <button onClick={sendOffer} className="btn-accent px-4">Send offer</button>
          <button onClick={() => setOfferOpen(false)} className="btn-ghost px-3">Cancel</button>
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-white/10 bg-white/[0.02] p-3">
        <button type="button" onClick={() => setOfferOpen((o) => !o)} className="btn-secondary px-3" title="Make an offer">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current"><path d="M10 1l2 2h3a2 2 0 0 1 2 2v3l2 2-2 2v3a2 2 0 0 1-2 2h-3l-2 2-2-2H5a2 2 0 0 1-2-2v-3l-2-2 2-2V5a2 2 0 0 1 2-2h3l2-2Zm-1 5v2H7v2h2v2h2v-2h2V8h-2V6H9Z"/></svg>
        </button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="input" />
        <button disabled={sending} className="btn-primary px-4">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current"><path d="M2 10 18 3l-4 14-4-5-5-2Z"/></svg>
        </button>
      </form>
    </div>
  );
}
