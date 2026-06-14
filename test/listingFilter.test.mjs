import { test } from "node:test";
import assert from "node:assert/strict";
import { buildListingWhere, describeSearch } from "../lib/listingFilter.js";

// Helper: find a clause in the AND array matching a predicate.
const has = (and, pred) => and.some(pred);

test("buildListingWhere always scopes to active listings", () => {
  const and = buildListingWhere({});
  assert.deepEqual(and, [{ status: "active" }]);
});

test("buildListingWhere maps each filter to the right clause", () => {
  const and = buildListingWhere({
    state: "tx",
    brand: "Michelin",
    condition: "used",
    size: "R17",
    season: "winter",
    runFlat: "1",
    maxPrice: "500",
    minYear: "2022",
    qty: "4",
    shipping: "1",
  });
  assert.ok(has(and, (c) => c.state === "TX"), "uppercases state");
  assert.ok(has(and, (c) => c.brand === "Michelin"));
  assert.ok(has(and, (c) => c.condition === "used"));
  assert.ok(has(and, (c) => c.size && c.size.contains === "R17"));
  assert.ok(has(and, (c) => c.season === "winter"));
  assert.ok(has(and, (c) => c.runFlat === true));
  assert.ok(has(and, (c) => c.priceCents && c.priceCents.lte === 50000), "price → cents");
  assert.ok(has(and, (c) => c.dotYear && c.dotYear.gte === 2022));
  assert.ok(has(and, (c) => c.quantity && c.quantity.gte === 4));
  assert.ok(has(and, (c) => c.shipping === true));
});

test("buildListingWhere ignores invalid state and builds a q OR", () => {
  const and = buildListingWhere({ state: "ZZ", q: "winter" });
  assert.ok(!has(and, (c) => "state" in c));
  const or = and.find((c) => Array.isArray(c.OR));
  assert.ok(or && or.OR.length === 4);
});

test("describeSearch produces a readable label", () => {
  const label = describeSearch(
    { brand: "Toyo", size: "245/40R19", condition: "used", shipping: "1", minYear: "2022" },
    (s) => s
  );
  assert.match(label, /Toyo/);
  assert.match(label, /245\/40R19/);
  assert.match(label, /Used/);
  assert.match(label, /Ships/);
  assert.equal(describeSearch({}), "All tires");
});
