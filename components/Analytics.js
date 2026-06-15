import Script from "next/script";

// Privacy-friendly analytics, loaded only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is
// set (e.g. on production). No cookies, no PII. A no-op locally / until configured.
export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  if (!domain) return null;
  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
