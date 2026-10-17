import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Site review tk-small-taps (2026-10-17): footer nav, breadcrumb and a few standalone text links were
// 16-20px tall on phones, under WCAG 2.5.8's 24px. (Source checks; node --test has no JSX loader.)
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("phone/touch media rule pads footer + breadcrumb links to a 32px row", () => {
  const css = read("../app/globals.css");
  const m = css.match(/@media \(max-width: 639px\), \(pointer: coarse\) \{([\s\S]*?)\n\}/);
  assert.ok(m, "touch-target media block missing");
  assert.match(m[1], /footer nav\[aria-label="Footer"\] a,\s*nav\[aria-label="Breadcrumb"\] a \{[^}]*min-height: 32px/);
});

test("footer nav and breadcrumbs keep the aria-labels the CSS targets", () => {
  assert.match(read("../app/layout.js"), /<nav [^>]*aria-label="Footer"/);
  for (const p of ["../app/browse/page.js", "../app/listings/[id]/page.js", "../app/guide/page.js"]) {
    assert.match(read(p), /aria-label="Breadcrumb"/, p);
  }
});

test("standalone small links carry vertical padding", () => {
  assert.match(read("../components/ReportListing.js"), /mx-auto block py-2 text-xs/);
  assert.match(read("../components/AuthForm.js"), /py-1\.5 text-xs[^"]*">Forgot password\?/);
  assert.match(read("../app/listings/[id]/page.js"), /inline-block py-1 text-sm[^"]*">Read the full buying guide/);
  const home = read("../app/page.js");
  assert.match(home, /className="py-1 hover:text-white">Open the map/);
  assert.match(home, /className="py-1 hover:text-white">Used-tire buying guide/);
});
