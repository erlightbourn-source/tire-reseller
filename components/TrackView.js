"use client";
import { useEffect } from "react";

const KEY = "tt_recently_viewed";

export default function TrackView({ id, brand, size, priceCents, photo }) {
  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
      const next = [{ id, brand, size, priceCents, photo }, ...prev.filter((x) => x.id !== id)].slice(0, 12);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [id]);
  return null;
}
