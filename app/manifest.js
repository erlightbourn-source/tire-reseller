export default function manifest() {
  return {
    name: "TireKind — Buy & Sell Tires",
    short_name: "TireKind",
    description: "The marketplace built for tire resellers.",
    start_url: "/",
    display: "standalone",
    background_color: "#070809",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
