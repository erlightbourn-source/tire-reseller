const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Absolute globs so content scanning works regardless of the process cwd
  // (the dev server may be launched from a parent directory).
  content: [
    path.join(__dirname, "app/**/*.{js,jsx}"),
    path.join(__dirname, "components/**/*.{js,jsx}"),
  ],
  theme: {
    extend: {
      // Brutalist pairing: Georgia (serif) body, Courier (mono) headers.
      fontFamily: {
        sans: ["Georgia", "Times New Roman", "serif"],
        display: ["var(--font-display)", '"Courier New"', "ui-monospace", "monospace"],
        mono: ["var(--font-display)", '"Courier New"', "monospace"],
      },
      // Two-color brutalist palette: near-black + electric cobalt blue.
      // Accent kept in the same luminance band as the prior acid-yellow so
      // dark-text-on-accent fills and accent-text-on-black both stay legible
      // (500 = 6.06:1 on ink-950/#000 body, 5.53:1 on ink-900 cards, 3.47:1 on
      // white — large/UI only, but the app has no white text surface) — a pure #0047FF cobalt is too
      // dark for the black-text-on-accent pattern used across the app.
      colors: {
        ink: {
          800: "#1a1a1a",
          900: "#0f0f0f",
          950: "#000000",
        },
        brand: {
          50: "#eef3ff",
          100: "#d6e2ff",
          200: "#b3caff",
          300: "#85a9ff",
          400: "#6b98ff",
          500: "#4d84ff",
          600: "#3d74ff",
          700: "#2f61e0",
          800: "#2450b8",
          900: "#1a3c8a",
        },
        accent: {
          400: "#6b98ff",
          500: "#4d84ff",
          600: "#3d74ff",
        },
      },
      // Brutalist hard offset shadows (no blur) — was soft/blurred, which
      // rendered non-brutalist on the sections still using shadow-lift/soft.
      boxShadow: {
        soft: "4px 4px 0 #000",
        lift: "6px 6px 0 #000",
        glow: "6px 6px 0 #4d84ff",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spinslow: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        spinslow: "spinslow 18s linear infinite",
      },
    },
  },
  plugins: [],
};
