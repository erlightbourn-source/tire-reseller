import { test } from "node:test";
import assert from "node:assert/strict";
import { publicLocation } from "../lib/publicLocation.js";

test("publicLocation: strips leading street address + ZIP, keeps city/state", () => {
  assert.equal(publicLocation("539 Charles St, Providence, RI 02903"), "Providence, RI");
});

test("publicLocation: city + state with no street address is unchanged", () => {
  assert.equal(publicLocation("Coral Springs, FL"), "Coral Springs, FL");
});

test("publicLocation: bare city with no state is unchanged", () => {
  assert.equal(publicLocation("Coral Springs"), "Coral Springs");
});

test("publicLocation: strips a trailing ZIP with no comma before it", () => {
  assert.equal(publicLocation("Providence, RI 02903"), "Providence, RI");
});

test("publicLocation: house-number-only input with nothing left returns empty", () => {
  assert.equal(publicLocation("539 Charles St"), "");
});

test("publicLocation: house number without a comma at all returns empty", () => {
  assert.equal(publicLocation("539 Charles Street Providence RI"), "");
});

test("publicLocation: empty/nullish input returns empty", () => {
  assert.equal(publicLocation(""), "");
  assert.equal(publicLocation(null), "");
  assert.equal(publicLocation(undefined), "");
});
