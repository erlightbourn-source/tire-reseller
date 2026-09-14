import { test } from "node:test";
import assert from "node:assert/strict";
import { isStateAbbr, stateName, stateFromLocation, userStateOf, STATES } from "../lib/states.js";

test("state grid is complete-ish and indexable", () => {
  assert.ok(STATES.length >= 49);
  assert.ok(isStateAbbr("tx"));
  assert.ok(isStateAbbr("FL"));
  assert.ok(!isStateAbbr("ZZ"));
  assert.equal(stateName("TX"), "Texas");
});

test("stateFromLocation parses trailing abbreviation and full names", () => {
  assert.equal(stateFromLocation("Dallas, TX"), "TX");
  assert.equal(stateFromLocation("Miami, Florida"), "FL");
  assert.equal(stateFromLocation("Nowhere"), null);
  assert.equal(stateFromLocation(""), null);
});

test("stateFromLocation resolves mid-string state (Google-Places / zip formats)", () => {
  // Regression: previously returned null because only the last comma segment
  // ("United States") was checked, silently dropping the listing from state filters.
  assert.equal(stateFromLocation("539 Charles St, Providence, RI 02904, United States"), "RI");
  assert.equal(stateFromLocation("Providence, Rhode Island"), "RI");
  assert.equal(stateFromLocation("Coral Springs, FL 33065, USA"), "FL");
  assert.equal(stateFromLocation("Florida"), "FL");
});

test("stateFromLocation prefers the real trailing state over a city 'La ...' token", () => {
  // Regression: a forward token scan matched "LA" inside "La Mesa" before the
  // real trailing "CA". Exact whole-segment match must win first.
  assert.equal(stateFromLocation("La Mesa, CA"), "CA");
  assert.equal(stateFromLocation("La Crosse, WI"), "WI");
  assert.equal(stateFromLocation("La Grange, IL"), "IL");
  assert.equal(stateFromLocation("La Jolla, CA"), "CA");
  // ZIP-guarded pass still resolves a city-token'd state when ZIP-followed.
  assert.equal(stateFromLocation("La Jolla, CA 92037, United States"), "CA");
});

test("userStateOf prefers saved state then falls back to location", () => {
  assert.equal(userStateOf({ state: "tx" }), "TX");
  assert.equal(userStateOf({ location: "Miami, FL" }), "FL");
  assert.equal(userStateOf({ state: "ZZ", location: "Austin, TX" }), "TX");
  assert.equal(userStateOf(null), null);
});
