export default function manifest() {
  return {
    name: "TireKind — Buy & Sell Tires",
    short_name: "TireKind",
    description: "The marketplace built for tire resellers.",
    start_url: "/",
    display: "standalone",
    background_color: "#070809",
    theme_color: "#070809",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
