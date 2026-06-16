/**
 * Config for precompiling the demo's Tailwind CSS to a static docs/tw.css,
 * replacing the runtime Play CDN (supply-chain hardening). Mirrors the inline
 * `tailwind.config` that used to live in docs/index.html.
 * Regenerate with:  npm run demo:css
 */
module.exports = {
  content: ["./docs/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Georgia", "Times New Roman", "serif"],
        display: ['"Courier Prime"', '"Courier New"', "ui-monospace", "monospace"],
        mono: ['"Courier Prime"', '"Courier New"', "monospace"],
      },
      colors: {
        ink: { 800: "#1a1a1a", 900: "#0f0f0f", 950: "#000000" },
        brand: { 50: "#fbffcc", 100: "#f6ff99", 200: "#f1ff66", 300: "#ecff33", 400: "#e5ff00", 500: "#e5ff00", 600: "#c9e000", 700: "#a8bd00", 800: "#7d8c00", 900: "#525c00" },
        accent: { 400: "#e5ff00", 500: "#e5ff00", 600: "#c9e000" },
      },
      keyframes: {
        spinslow: { to: { transform: "rotate(360deg)" } },
        fadeup: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        glitch: { "0%,100%": { transform: "translate(0)" }, "20%": { transform: "translate(-2px,1px)" }, "40%": { transform: "translate(2px,-1px)" }, "60%": { transform: "translate(-1px,-1px)" }, "80%": { transform: "translate(1px,1px)" } },
      },
      animation: { spinslow: "spinslow 18s linear infinite", fadeup: "fadeup .4s ease-out both", glitch: "glitch .18s steps(2) infinite" },
    },
  },
};
