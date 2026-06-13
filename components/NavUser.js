"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
      {initials}
    </span>
  );
}

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
        <Link href="/" className="hidden px-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
          Browse
        </Link>
        <Link href="/login" className="btn-secondary">Log in</Link>
        <Link href="/signup" className="btn-primary">Get started</Link>
      </nav>
    );
  }

  const active = user.subscriptionStatus === "active";
  const links = [
    { href: "/", label: "Browse" },
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
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-slate-100"
        >
          <Avatar name={user.name} />
          <svg viewBox="0 0 20 20" className="hidden h-4 w-4 fill-slate-400 sm:block"><path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{active ? "Seller · Active" : "Buyer"}</p>
            </div>
            <Link href="/dashboard" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 md:hidden">Dashboard</Link>
            <Link href="/messages" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 md:hidden">Messages</Link>
            <button onClick={logout} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
