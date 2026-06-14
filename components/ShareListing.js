"use client";
import { useState } from "react";

export default function ShareListing({ brand, size }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: `${brand} ${size} on TireTrader`, text: `Check out these ${brand} ${size} tires`, url };
    if (navigator.share) {
      try { await navigator.share(data); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button onClick={share} className="btn-ghost px-3 py-1.5 text-sm">
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M14 7a3 3 0 1 0-2.8-4H11a3 3 0 0 0 .1.8L7.7 5.6a3 3 0 1 0 0 4.8l3.4 1.8a3 3 0 1 0 .8-1.4L8.5 9a3 3 0 0 0 0-.9l3.4-1.8A3 3 0 0 0 14 7Z"/></svg>
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
