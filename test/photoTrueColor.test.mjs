import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Listing photos are the buyer's evidence of tire condition, so they must render in true colour.
// The June brutalist theme had `main img { filter: grayscale(100%) ... }`, which turned every listing,
// gallery, dashboard and message photo black-and-white. Monochrome is now an opt-in .img-mono class.
// (Components are JSX; node --test has no JSX loader, so this checks source.)
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const css = read("../app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");

test("no global rule filters every image inside main", () => {
  assert.doesNotMatch(css, /(^|[}\s,])main\s+img\s*[,{][^}]*filter/);
  assert.doesNotMatch(css, /(^|[}\s,])img\s*\{[^}]*grayscale/);
});

test("monochrome stays available as an opt-in class", () => {
  assert.match(css, /\.img-mono\s*\{[^}]*grayscale\(100%\)/);
});

test("listing photo components do not opt into monochrome", () => {
  for (const p of [
    "../components/PhotoGallery.js",
    "../components/ListingCardImage.js",
    "../components/ListingForm.js",
    "../components/RecentlyViewed.js",
    "../app/dashboard/page.js",
    "../app/messages/page.js",
    "../app/messages/[threadId]/page.js",
  ]) {
    const src = read(p);
    assert.doesNotMatch(src, /img-mono|grayscale/, p);
  }
});
