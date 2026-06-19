import { test } from "node:test";
import assert from "node:assert/strict";
import { brandSlug, sizeSlug } from "../lib/site.js";
import { parseTireSize } from "../lib/tiresize.js";

test("brandSlug: lowercases and dashes", () => {
  assert.equal(brandSlug("Michelin"), "michelin");
  assert.equal(brandSlug("Goodyear Eagle"), "goodyear-eagle");
  assert.equal(brandSlug("BFGoodrich  All-Terrain"), "bfgoodrich-all-terrain");
});

test("brandSlug: trims leading/trailing separators", () => {
  assert.equal(brandSlug("  Pirelli! "), "pirelli");
  assert.equal(brandSlug("/Continental/"), "continental");
});

test("sizeSlug: tire size to url slug", () => {
  assert.equal(sizeSlug("225/45R17"), "225-45r17");
  assert.equal(sizeSlug("245/40R18"), "245-40r18");
  assert.equal(sizeSlug("LT265/70R17"), "lt265-70r17");
});

test("sizeSlug round-trips through the size-page resolver", () => {
  // The /sizes/[size] page resolves a slug by replacing dashes with slashes
  // then parsing. The canonical label must slugify back to the same slug.
  for (const size of ["225/45R17", "245/40R18", "265/70R17", "205/55R16"]) {
    const slug = sizeSlug(size);
    const { width, aspect, rim } = parseTireSize(slug.replace(/-/g, "/"));
    assert.ok(width && aspect && rim, `parsed ${slug}`);
    const label = `${width}/${aspect}R${rim}`;
    assert.equal(sizeSlug(label), slug);
  }
});
