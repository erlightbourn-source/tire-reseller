import { test } from "node:test";
import assert from "node:assert/strict";
import { isProSeller } from "../lib/seller.js";

test("isProSeller: paid Pro sellers qualify", () => {
  assert.equal(isProSeller({ pro: true, foundingSeller: false }), true);
});

test("isProSeller: founding sellers qualify without a Pro subscription", () => {
  assert.equal(isProSeller({ pro: false, foundingSeller: true }), true);
});

test("isProSeller: a founder who also pays still qualifies", () => {
  assert.equal(isProSeller({ pro: true, foundingSeller: true }), true);
});

test("isProSeller: plain sellers do not qualify", () => {
  assert.equal(isProSeller({ pro: false, foundingSeller: false }), false);
});

test("isProSeller: null/undefined/missing flags are safe", () => {
  assert.equal(isProSeller(null), false);
  assert.equal(isProSeller(undefined), false);
  assert.equal(isProSeller({}), false);
});
