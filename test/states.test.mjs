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

test("userStateOf prefers saved state then falls back to location", () => {
  assert.equal(userStateOf({ state: "tx" }), "TX");
  assert.equal(userStateOf({ location: "Miami, FL" }), "FL");
  assert.equal(userStateOf({ state: "ZZ", location: "Austin, TX" }), "TX");
  assert.equal(userStateOf(null), null);
});
