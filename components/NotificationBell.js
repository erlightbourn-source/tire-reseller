"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

export default function NotificationBell() {
  const [n, setN] = useState({ unreadMessages: 0, pendingOffers: 0, newMatches: 0, total: 0 });
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setN(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const items = [
    { show: n.unreadMessages > 0, href: "/messages", icon: "💬", label: `${n.unreadMessages} unread message${n.unreadMessages !== 1 ? "s" : ""}` },
    { show: n.pendingOffers > 0, href: "/messages", icon: "🤝", label: `${n.pendingOffers} offer${n.pendingOffers !== 1 ? "s" : ""} awaiting you` },
    { show: n.newMatches > 0, href: "/saved", icon: "🔔", label: `${n.newMatches} new match${n.newMatches !== 1 ? "es" : ""} for saved searches` },
  ].filter((i) => i.show);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/5 hover:text-white"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current"><path d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5A1 1 0 0 0 4.3 14h11.4a1 1 0 0 0 .8-1.5L15 10V7a5 5 0 0 0-5-5Zm0 16a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 10 18Z" /></svg>
        {n.total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {n.total > 9 ? "9+" : n.total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] py-1 backdrop-blur-xl shadow-2xl">
          <div className="border-b border-white/10 px-3 py-2 text-sm font-semibold text-white">Notifications</div>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">You're all caught up 🎉</p>
          ) : (
            items.map((i, idx) => (
              <Link key={idx} href={i.href} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5">
                <span>{i.icon}</span>
                <span>{i.label}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
