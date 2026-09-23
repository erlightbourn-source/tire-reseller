"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="grid h-8 w-8 place-items-center bg-brand-500 text-xs font-bold text-black">
      {initials}
    </span>
  );
}

const GUEST_LINKS = [
  { href: "/browse", label: "Browse tires" },
  { href: "/locations", label: "Locations" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/guide", label: "Buying guide" },
  { href: "/sell-tires", label: "Sell tires" },
  { href: "/founding-seller", label: "Founding Seller" },
  { href: "/trust-safety", label: "Trust & Safety" },
];

export default function NavUser({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/browse" className="hidden px-2 text-sm font-medium text-slate-300 hover:text-white sm:block">
          Browse
        </Link>
        <Link href="/login" className="btn-secondary whitespace-nowrap px-2.5 sm:px-4">Log in</Link>
        <Link href="/signup" className="btn-primary whitespace-nowrap px-2.5 sm:px-4">Get started</Link>
        {/* Phones: the header has no room for page links, so they live in this menu. */}
        <div className="relative sm:hidden">
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="grid h-10 w-10 place-items-center text-slate-200 transition hover:bg-white/10"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
              {open ? (
                <path d="M5.3 4 10 8.7 14.7 4 16 5.3 11.3 10l4.7 4.7-1.3 1.3L10 11.3 5.3 16 4 14.7 8.7 10 4 5.3Z" />
              ) : (
                <path d="M3 5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
              )}
            </svg>
          </button>
          {open && (
            <div id="mobile-menu" className="glass absolute right-0 mt-2 w-56 overflow-hidden py-1 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)]">
              {GUEST_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5">
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    );
  }

  const active = user.canSell;
  const links = [
    { href: "/browse", label: "Browse" },
    { href: "/favorites", label: "Saved" },
    { href: "/saved", label: "Alerts" },
    { href: "/messages", label: "Messages" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <div className="hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {active ? (
        <Link href="/sell" className="btn-primary">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z" /></svg>
          <span className="hidden sm:inline">Sell tires</span>
        </Link>
      ) : (
        <Link href="/subscribe" className="btn-accent">Become a seller</Link>
      )}

      <NotificationBell />

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex items-center gap-2 p-0.5 pr-2 transition hover:bg-white/10"
        >
          <Avatar name={user.name} />
          <svg viewBox="0 0 20 20" className="hidden h-4 w-4 fill-slate-400 sm:block"><path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </button>
        {open && (
          <div className="glass absolute right-0 mt-2 w-48 overflow-hidden py-1 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)]">
            <div className="border-b border-white/10 px-3 py-2">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role === "seller" ? "Seller" : "Buyer"}</p>
            </div>
            <Link href="/browse" className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5 md:hidden">Browse</Link>
            <Link href="/favorites" className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5 md:hidden">Saved</Link>
            <Link href="/saved" className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5 md:hidden">Alerts</Link>
            <Link href="/dashboard" className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5 md:hidden">Dashboard</Link>
            <Link href="/messages" className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5 md:hidden">Messages</Link>
            <Link href="/settings" className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Settings</Link>
            {user.admin && <Link href="/admin" className="block px-3 py-2 text-sm text-brand-300 hover:bg-white/5">🛡 Moderation</Link>}
            <button onClick={logout} className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10">
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
