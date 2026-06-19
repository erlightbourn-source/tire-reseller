import { ImageResponse } from "next/og";

// Default branded social card (1200×630) used when a route doesn't supply its
// own. Brutalist brand: black canvas, acid-yellow accent, hard offset block.
export const runtime = "nodejs";
export const alt = "TireTrader — buy & sell tires locally";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          padding: "72px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "84px",
              height: "84px",
              background: "#e5ff00",
              color: "#000000",
              fontSize: "52px",
              fontWeight: 800,
              border: "4px solid #e5ff00",
            }}
          >
            T
          </div>
          <div style={{ color: "#ffffff", fontSize: "40px", fontWeight: 800, letterSpacing: "-1px" }}>
            TIRETRADER
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              color: "#e5ff00",
              fontSize: "84px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-2px",
            }}
          >
            Buy &amp; sell tires
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: "84px", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-2px" }}>
            with people near you.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", color: "#9ca3af", fontSize: "30px" }}>
            New &amp; used · Compare tread, DOT year &amp; per-tire price
          </div>
          <div
            style={{
              display: "flex",
              background: "#e5ff00",
              color: "#000000",
              fontSize: "30px",
              fontWeight: 800,
              padding: "14px 28px",
            }}
          >
            tiretrader
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
