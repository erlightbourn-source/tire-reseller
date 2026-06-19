"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATES, GRID_COLS, GRID_ROWS, stateName } from "@/lib/states";

export default function StateMap({ counts = {}, selected = null, loggedIn = false }) {
  const router = useRouter();
  const [hover, setHover] = useState(selected);
  const max = Math.max(1, ...STATES.map((s) => counts[s.abbr] || 0));

  async function go(abbr) {
    // Logged-in members: remember this as their home state.
    if (loggedIn) {
      try {
        await fetch("/api/profile/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: abbr }),
        });
      } catch {}
    }
    router.push(`/browse?state=${abbr}`);
    router.refresh();
  }

  // graduated fill by listing count
  function cls(abbr) {
    const n = counts[abbr] || 0;
    if (n === 0) return "bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-slate-300";
    const t = n / max;
    if (t > 0.66) return "bg-brand-500 text-white hover:bg-brand-400";
    if (t > 0.33) return "bg-brand-500/60 text-white hover:bg-brand-500/80";
    return "bg-brand-500/30 text-brand-100 hover:bg-brand-500/50";
  }

  const focus = hover || selected;
  const focusCount = focus ? counts[focus] || 0 : 0;

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Step 1 · Choose your state</p>
          <h2 className="font-display text-xl font-bold text-white">
            {focus ? (
              <>
                {stateName(focus)}{" "}
                <span className="text-sm font-medium text-slate-400">
                  · {focusCount} listing{focusCount !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              "Where are you shopping?"
            )}
          </h2>
        </div>
        {selected && (
          <button onClick={() => go(selected)} className="btn-primary">
            Browse {stateName(selected)} →
          </button>
        )}
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div
          className="mx-auto grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0,1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0,1fr))`,
            minWidth: 540,
            maxWidth: 760,
          }}
        >
          {STATES.map((s) => {
            const n = counts[s.abbr] || 0;
            const isSel = selected === s.abbr;
            return (
              <button
                key={s.abbr}
                onClick={() => go(s.abbr)}
                onMouseEnter={() => setHover(s.abbr)}
                onMouseLeave={() => setHover(selected)}
                title={`${stateName(s.abbr)} — ${n} listing${n !== 1 ? "s" : ""}`}
                style={{ gridColumn: s.col + 1, gridRow: s.row + 1 }}
                className={`relative grid aspect-square place-items-center rounded-lg text-[11px] font-bold transition ${cls(
                  s.abbr
                )} ${isSel ? "ring-2 ring-accent-400 ring-offset-2 ring-offset-[#13161c]" : ""}`}
              >
                {s.abbr}
                {n > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink-950 px-1 text-[9px] font-bold text-white ring-1 ring-white/15">
                    {n}
                  </span>
                )}
                {isSel && (
                  <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Fewer</span>
          <span className="h-3 w-5 rounded bg-white/[0.06]" />
          <span className="h-3 w-5 rounded bg-brand-500/30" />
          <span className="h-3 w-5 rounded bg-brand-500/60" />
          <span className="h-3 w-5 rounded bg-brand-500" />
          <span>More listings</span>
        </div>
        <button onClick={() => router.push("/browse")} className="text-sm font-semibold text-brand-300 hover:underline">
          Browse all states →
        </button>
      </div>
    </div>
  );
}
