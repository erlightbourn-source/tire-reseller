"use client";

import { useEffect, useRef, useState } from "react";
import { cardImageLoading } from "@/lib/cardImage";

// Listing-card photo. Client component so a photo that fails to load swaps to
// the tire placeholder instead of showing the browser's broken-image alt text.
export default function ListingCardImage({ src, alt, index }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);
  const { loading, fetchPriority } = cardImageLoading(index);

  // The image can fail before React hydrates, in which case onError never
  // fires. Check the element's final state once on mount.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return <Placeholder />;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setFailed(true)}
      // text-transparent: if the image is still broken before hydration, the
      // alt text is not painted over the card.
      className="h-full w-full object-cover text-transparent transition duration-300 group-hover:scale-[1.06]"
    />
  );
}

export function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink-900" data-card-placeholder="">
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-slate-700" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <circle cx="32" cy="32" r="26" />
        <circle cx="32" cy="32" r="11" />
        <circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1={32 + 19 * Math.cos(a)} y1={32 + 19 * Math.sin(a)} x2={32 + 25 * Math.cos(a)} y2={32 + 25 * Math.sin(a)} strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}
