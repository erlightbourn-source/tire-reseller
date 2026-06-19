"use client";
import { useState } from "react";

export default function PhotoGallery({ photos, alt }) {
  const [active, setActive] = useState(0);
  if (!photos || photos.length === 0) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-gradient-to-br from-slate-800 to-ink-900 text-6xl text-slate-400">
        ◎
      </div>
    );
  }
  return (
    <div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[active].url} alt={alt} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id || i}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${photos.length}`}
              aria-current={i === active ? "true" : undefined}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === active ? "ring-brand-400" : "ring-white/10 hover:ring-white/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
