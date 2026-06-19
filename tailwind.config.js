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
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.12)",
        lift: "0 8px 30px -8px rgba(15,23,42,0.18)",
        glow: "0 10px 40px -10px rgba(37,69,230,0.45)",
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
