import Script from "next/script";

// Privacy-friendly analytics. No cookies, no PII.
// - Cloudflare Web Analytics (free): on in production builds only. The site token
//   is public by design (it ships in page HTML); override with NEXT_PUBLIC_CF_BEACON_TOKEN.
// - Plausible: loaded only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
const CF_BEACON_TOKEN =
  process.env.NEXT_PUBLIC_CF_BEACON_TOKEN || "0f5c3ff0de3841309eb60ec66a0fcb8d";

export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  const cf = process.env.NODE_ENV === "production" && CF_BEACON_TOKEN;
  return (
    <>
      {cf ? (
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
          strategy="afterInteractive"
        />
      ) : null}
      {domain ? <Script defer data-domain={domain} src={src} strategy="afterInteractive" /> : null}
    </>
  );
}
