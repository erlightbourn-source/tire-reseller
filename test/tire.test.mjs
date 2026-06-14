import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTread, treadLabel, treadLifePct, perTire, milesLabel, tireAge, seasonLabel, conditionMeta } from "../lib/tire.js";

test("parseTread handles 32nds, 'new', and junk", () => {
  assert.equal(parseTread("9/32in").n, 9);
  assert.equal(parseTread("new").n, 10);
  assert.equal(parseTread("8/32").label, '8/32"');
  assert.equal(parseTread(""), null);
  assert.equal(parseTread("bald").n, null);
});

test("treadLabel and treadLifePct", () => {
  assert.equal(treadLabel("6/32in"), '6/32"');
  assert.equal(treadLifePct("10/32"), 100);
  assert.equal(treadLifePct("2/32"), 0);
  assert.equal(treadLifePct("6/32"), 50);
  assert.equal(treadLifePct("unknown"), null);
});

test("perTire divides by quantity safely", () => {
  assert.equal(perTire(40000, 4), 10000);
  assert.equal(perTire(40000, 0), 40000); // guards against /0
});

test("milesLabel formats distances", () => {
  assert.equal(milesLabel(0.5), "Less than 1 mi away");
  assert.equal(milesLabel(12.4), "12 mi away");
  assert.equal(milesLabel(null), null);
  assert.equal(milesLabel(Infinity), null);
});

test("tireAge flags aging tires", () => {
  const yr = new Date().getFullYear();
  assert.equal(tireAge(null), null);
  assert.equal(tireAge(yr).aging, false);
  assert.equal(tireAge(yr - 7).aging, true);
});

test("labels and condition metadata", () => {
  assert.equal(seasonLabel("all-season"), "All-season");
  assert.equal(conditionMeta("new").label, "New");
  assert.equal(conditionMeta("used").tone, "amber");
  assert.equal(conditionMeta("weird").label, "Used"); // fallback
});
