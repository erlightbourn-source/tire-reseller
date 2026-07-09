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
      // Two-color brutalist palette: near-black + acid yellow.
      colors: {
        ink: {
          800: "#1a1a1a",
          900: "#0f0f0f",
          950: "#000000",
        },
        brand: {
          50: "#fbffcc",
          100: "#f6ff99",
          200: "#f1ff66",
          300: "#ecff33",
          400: "#e5ff00",
          500: "#e5ff00",
          600: "#c9e000",
          700: "#a8bd00",
          800: "#7d8c00",
          900: "#525c00",
        },
        accent: {
          400: "#e5ff00",
          500: "#e5ff00",
          600: "#c9e000",
        },
      },
      // Brutalist hard offset shadows (no blur) — was soft/blurred, which
      // rendered non-brutalist on the sections still using shadow-lift/soft.
      boxShadow: {
        soft: "4px 4px 0 #000",
        lift: "6px 6px 0 #000",
        glow: "6px 6px 0 #e5ff00",
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
