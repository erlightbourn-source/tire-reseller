import { test } from "node:test";
import assert from "node:assert/strict";
import { milesBetween, geocodeCity, cityOptions } from "../lib/geo.js";

test("milesBetween computes a sane great-circle distance", () => {
  // NYC -> LA is ~2445 miles; allow a tolerance.
  const d = milesBetween(40.7128, -74.006, 34.0522, -118.2437);
  assert.ok(d > 2300 && d < 2600, `got ${d}`);
  assert.equal(milesBetween(0, 0, 0, 0), 0);
});

test("milesBetween returns Infinity for non-numeric input", () => {
  assert.equal(milesBetween(1, 2, null, 4), Infinity);
});

test("geocodeCity resolves known cities and rejects unknowns", () => {
  const dallas = geocodeCity("Dallas, TX");
  assert.ok(dallas && Math.abs(dallas.lat - 32.7767) < 0.01);
  assert.ok(geocodeCity("Atlantis, ZZ") === null);
});

test("cityOptions returns a non-empty labeled list", () => {
  const opts = cityOptions();
  assert.ok(opts.length > 10);
  assert.ok(opts[0].label.includes(","));
});
