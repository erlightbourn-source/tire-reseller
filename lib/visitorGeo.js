import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BROWARD } from "./nearest.js";

// Visitor's approximate location from Cloudflare's IP geolocation (request.cf).
// Anywhere it's unavailable (local dev, Vercel rollback, no cf data) this is Broward.
export function visitorOrigin() {
  try {
    const cf = getCloudflareContext().cf;
    const lat = Number(cf?.latitude), lng = Number(cf?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) return { lat, lng, source: "ip" };
  } catch {}
  return { ...BROWARD, source: "broward" };
}
