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
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      colors: {
        // Deep automotive ink for dark surfaces
        ink: {
          800: "#15171c",
          900: "#0d0f13",
          950: "#070809",
        },
        brand: {
          50: "#eff4ff",
          100: "#dbe6fe",
          200: "#bdd0fe",
          300: "#90b0fc",
          400: "#5c86f8",
          500: "#3b63f1",
          600: "#2545e6",
          700: "#1d33d3",
          800: "#1e2cab",
          900: "#1e2b87",
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
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
