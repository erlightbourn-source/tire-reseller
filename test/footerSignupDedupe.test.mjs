import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Listing-detail and size pages already carry a contextual match-alert capture. The footer
// "Get TireKind news" signup used to render right after it (two email asks back to back).
// Wiring: those pages mark their alert with data-match-alert, the footer block is marked
// data-footer-signup, and one CSS rule hides the footer block only when a match-alert is on the page.
// (Layout and pages are JSX server components; node --test has no JSX loader, so this checks source.)
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("footer signup block is marked data-footer-signup", () => {
  const src = read("../app/layout.js");
  assert.equal((src.match(/data-footer-signup/g) || []).length, 1);
  assert.match(src, /<div className="mt-4" data-footer-signup>[\s\S]{0,200}Get TireKind news/);
});

test("css hides the footer signup only when a match-alert is present", () => {
  const css = read("../app/globals.css");
  assert.match(css, /body:has\(\[data-match-alert\]\)\s+\[data-footer-signup\]\s*\{\s*display:\s*none/);
});

test("listing alert and size-page alert carry data-match-alert", () => {
  assert.match(read("../components/ListingSizeAlert.js"), /data-match-alert/);
  assert.match(read("../app/sizes/[size]/page.js"), /data-match-alert/);
});

test("no other page marks itself as a match-alert (footer signup stays everywhere else)", () => {
  for (const p of ["../app/page.js", "../app/browse/page.js", "../app/tires/[brand]/page.js", "../app/used-tires/[city]/page.js"]) {
    assert.doesNotMatch(read(p), /data-match-alert/, p);
  }
});
