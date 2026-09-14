import { test } from "node:test";
import assert from "node:assert/strict";
import { milesBetween, geocodeCity, cityOptions, STATE_CENTROIDS } from "../lib/geo.js";

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

test("geocodeCity falls back to the state centroid for an unknown city", () => {
  // Regression: Coral Springs isn't in CITIES, so it used to geocode to null and
  // drop out of every "near me" radius query. With a known state it now lands on
  // the FL centroid (flagged approx), placing it roughly right.
  const explicit = geocodeCity("Coral Springs", "FL");
  assert.ok(explicit && explicit.approx === true);
  assert.ok(Math.abs(explicit.lat - STATE_CENTROIDS.FL[0]) < 0.001);
  // State parsed from the location text works too ("City, ST").
  const parsed = geocodeCity("Coral Springs, FL");
  assert.ok(parsed && parsed.approx === true && Math.abs(parsed.lng - STATE_CENTROIDS.FL[1]) < 0.001);
  // An exact city hit is NOT flagged approx and keeps its real coords.
  const dallas = geocodeCity("Dallas, TX");
  assert.ok(dallas && dallas.approx === undefined && Math.abs(dallas.lat - 32.7767) < 0.01);
  // No state anywhere, or an invalid one → still null (no false placement).
  assert.equal(geocodeCity("Coral Springs"), null);
  assert.equal(geocodeCity("Nowhere, ZZ"), null);
});

test("cityOptions returns a non-empty labeled list", () => {
  const opts = cityOptions();
  assert.ok(opts.length > 10);
  assert.ok(opts[0].label.includes(","));
});
