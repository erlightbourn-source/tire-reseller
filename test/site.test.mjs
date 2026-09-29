import { test } from "node:test";
import assert from "node:assert/strict";
import { brandSlug, sizeSlug, safeNextPath } from "../lib/site.js";
import { parseTireSize } from "../lib/tiresize.js";

const ORIGIN = "https://tirekind.com";

test("safeNextPath keeps legitimate same-origin paths (incl. query/hash)", () => {
  assert.equal(safeNextPath("/listings/abc123", ORIGIN), "/listings/abc123");
  assert.equal(safeNextPath("/browse?state=FL&size=225%2F45R17", ORIGIN), "/browse?state=FL&size=225%2F45R17");
  assert.equal(safeNextPath("/messages/t1#latest", ORIGIN), "/messages/t1#latest");
  assert.equal(safeNextPath("/sell/abc/tiktok", ORIGIN), "/sell/abc/tiktok");
});

test("safeNextPath rejects every open-redirect shape (backslash/control-char bypasses)", () => {
  // These four all passed the old `startsWith("/") && !startsWith("//")` check
  // yet resolve to https://evil.com in a browser's URL parser.
  for (const evil of ["/\\evil.com", "/\\/evil.com", "/\t/evil.com", "/\n/evil.com", "/\r/evil.com"]) {
    assert.equal(safeNextPath(evil, ORIGIN), null, JSON.stringify(evil));
    // Sanity: prove the input really is dangerous under plain URL resolution.
    assert.equal(new URL(evil, ORIGIN).host, "evil.com", `precondition ${JSON.stringify(evil)}`);
  }
  for (const evil of ["//evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "", null, undefined, 42]) {
    assert.equal(safeNextPath(evil, ORIGIN), null, String(evil));
  }
});

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
