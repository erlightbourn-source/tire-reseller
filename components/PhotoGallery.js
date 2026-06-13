"use client";
import { useState } from "react";

export default function PhotoGallery({ photos, alt }) {
  const [active, setActive] = useState(0);
  if (!photos || photos.length === 0) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-gradient-to-br from-slate-800 to-ink-900 text-6xl text-slate-600">
        ◎
      </div>
    );
  }
  return (
    <div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[active].url} alt={alt} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id || i}
              onClick={() => setActive(i)}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === active ? "ring-brand-500" : "ring-transparent hover:ring-slate-300"
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
