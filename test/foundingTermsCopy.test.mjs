import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Quinn 2026-10-17: the Terms (lib/legal.js "Price changes & Founding price") end the Founding price
// on cancellation or a 30+ day lapse, so site copy must not promise it "for life" / "forever".
// (Pages are JSX; node --test has no JSX loader, so this checks source.)
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const FILES = [
  "../lib/pricing.js",
  "../app/founding-seller/page.js",
  "../app/sell/page.js",
  "../app/dashboard/page.js",
  "../app/pro/page.js",
  "../app/subscribe/page.js",
  "../app/used-tires/[city]/page.js",
  "../outreach/onepager-digital.html",
  "../outreach/onepager-print.html",
];

test("no lifetime / forever / permanent price or badge claims in buyer- and seller-facing copy", () => {
  for (const p of FILES) {
    assert.doesNotMatch(read(p), /for life|forever|permanent badge|permanent founding|never goes away/i, p);
  }
});

test("the Terms still limit the Founding price to an active subscription", () => {
  assert.match(read("../lib/legal.js"), /Founding price for as long as their subscription stays\s+continuously active/);
});

test("shared plan copy says the lock lasts while subscribed", async () => {
  const { PLAN_COPY } = await import("../lib/pricing.js");
  for (const k of ["foundingStory", "foundingBanner", "foundingLock"]) {
    assert.match(PLAN_COPY[k], /subscribed/, k);
  }
});
