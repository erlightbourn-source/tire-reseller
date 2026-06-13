"use client";
import { useState } from "react";

export default function NotifyApp() {
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");

  // Placeholder only — the mobile app isn't built yet, so this doesn't send
  // anything. Wire it to your email provider / waitlist when the app ships.
  function submit(e) {
    e.preventDefault();
    if (email.includes("@")) setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
        🎉 You're on the list — we'll email you the moment the app launches.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="input"
      />
      <button className="btn-primary whitespace-nowrap px-5">Notify me</button>
    </form>
  );
}
