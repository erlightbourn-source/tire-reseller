import { test } from "node:test";
import assert from "node:assert/strict";
import { priceContext } from "../lib/pricing.js";

test("priceContext returns null without enough comps", () => {
  assert.equal(priceContext(10000, [9000, 11000]), null); // only 2 comps
  assert.equal(priceContext(10000, []), null);
  assert.equal(priceContext(0, [9000, 10000, 11000]), null); // invalid price
});

test("priceContext flags a good deal", () => {
  const r = priceContext(8000, [10000, 10000, 10000]); // 20% below 10000
  assert.equal(r.tone, "good");
  assert.equal(r.avg, 10000);
  assert.equal(r.deltaPct, -20);
  assert.equal(r.count, 3);
});

test("priceContext flags an above-average price", () => {
  const r = priceContext(12000, [10000, 10000, 10000]); // 20% above
  assert.equal(r.tone, "high");
  assert.equal(r.deltaPct, 20);
});

test("priceContext calls near-average prices fair", () => {
  const r = priceContext(10300, [10000, 10000, 10500, 9800]);
  assert.equal(r.tone, "fair");
});

test("priceContext ignores invalid comp values", () => {
  const r = priceContext(9000, [10000, 0, NaN, 10000, 10000]);
  assert.equal(r.count, 3);
});
