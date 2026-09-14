// Spike config for the Cloudflare port (de/cf-port-spike). Minimal — R2/KV/D1
// bindings get wired in the real port once CF auth lands.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
