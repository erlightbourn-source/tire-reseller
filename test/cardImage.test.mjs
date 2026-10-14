// Listing-card photo loading policy: the first 4 cards on a list load eagerly
// (first 2 at high fetch priority) so above-the-fold photos never depend on the
// lazy-load heuristic; later cards stay lazy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cardImageLoading, EAGER_CARD_COUNT, HIGH_PRIORITY_CARD_COUNT } from "../lib/cardImage.js";

test("first two cards are eager with high fetch priority", () => {
  for (const i of [0, 1]) {
    assert.deepEqual(cardImageLoading(i), { loading: "eager", fetchPriority: "high" });
  }
});

test("cards 3 and 4 are eager without high priority", () => {
  for (const i of [2, 3]) {
    assert.deepEqual(cardImageLoading(i), { loading: "eager", fetchPriority: undefined });
  }
});

test("card 5 onward stays lazy", () => {
  for (const i of [4, 5, 11, 59]) {
    assert.deepEqual(cardImageLoading(i), { loading: "lazy", fetchPriority: undefined });
  }
});

test("unknown or invalid position stays lazy", () => {
  for (const i of [undefined, null, -1, 1.5, NaN, "0"]) {
    assert.equal(cardImageLoading(i).loading, "lazy");
    assert.equal(cardImageLoading(i).fetchPriority, undefined);
  }
});

test("thresholds are 4 eager / 2 high", () => {
  assert.equal(EAGER_CARD_COUNT, 4);
  assert.equal(HIGH_PRIORITY_CARD_COUNT, 2);
});
