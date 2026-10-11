import { test } from "node:test";
import assert from "node:assert/strict";
import { buildListingBody, dotYearInputAttrs } from "../lib/listingBody.js";
import { parseDotYear } from "../lib/listingProof.js";

function formOf(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}
const PHOTOS = ["https://x/1.jpg"];

test("create sends dotYear and the other form fields", () => {
  const body = buildListingBody(formOf({ brand: "Michelin", dotYear: "2022" }), null, false, PHOTOS);
  assert.equal(body.dotYear, "2022");
  assert.equal(body.brand, "Michelin");
  assert.deepEqual(body.photos, PHOTOS);
});

test("create keeps an empty dotYear so the server can reject it as required", () => {
  const body = buildListingBody(formOf({ dotYear: "" }), null, false, PHOTOS);
  assert.equal(body.dotYear, "");
});

test("edit with unchanged dotYear omits it", () => {
  const body = buildListingBody(formOf({ dotYear: "2021", price: "100" }), { dotYear: 2021 }, true, PHOTOS);
  assert.equal("dotYear" in body, false);
  assert.equal(body.price, "100");
});

test("edit with changed dotYear sends it", () => {
  const body = buildListingBody(formOf({ dotYear: "2023" }), { dotYear: 2021 }, true, PHOTOS);
  assert.equal(body.dotYear, "2023");
});

test("edit with a cleared dotYear omits it", () => {
  const body = buildListingBody(formOf({ dotYear: "" }), { dotYear: 2021 }, true, PHOTOS);
  assert.equal("dotYear" in body, false);
});

test("edit adding a dotYear to a listing that had none sends it", () => {
  const body = buildListingBody(formOf({ dotYear: "2022" }), { dotYear: null }, true, PHOTOS);
  assert.equal(body.dotYear, "2022");
});

test("legacy out-of-range dotYear left unchanged is omitted, so the PATCH body no longer trips validation", () => {
  const form = formOf({ dotYear: "1975", price: "120" });
  assert.throws(() => parseDotYear("1975")); // what the server would do if it were resent
  const body = buildListingBody(form, { dotYear: 1975 }, true, PHOTOS);
  assert.equal("dotYear" in body, false);
  assert.equal(body.price, "120");
});

test("checkboxes become explicit booleans in both modes", () => {
  const on = buildListingBody(formOf({ runFlat: "on" }), null, false, PHOTOS);
  assert.equal(on.runFlat, true);
  assert.equal(on.shipping, false);
});

/* ---------------- dotYearInputAttrs: browser-side range check ---------------- */
const RANGE = { min: 1990, max: 2027 };

test("create: required with min/max", () => {
  const a = dotYearInputAttrs({ editing: false, initialDotYear: null, value: "", ...RANGE });
  assert.deepEqual(a, { required: true, min: 1990, max: 2027 });
});

test("create: min/max stay even if the value looks like a stored one", () => {
  const a = dotYearInputAttrs({ editing: false, initialDotYear: 1975, value: "1975", ...RANGE });
  assert.equal(a.min, 1990);
  assert.equal(a.max, 2027);
});

test("edit: unchanged legacy out-of-range year drops min/max so the browser does not block submit", () => {
  const a = dotYearInputAttrs({ editing: true, initialDotYear: 1975, value: "1975", ...RANGE });
  assert.equal(a.required, false);
  assert.equal("min" in a, false);
  assert.equal("max" in a, false);
});

test("edit: cleared field drops min/max and is not required", () => {
  const a = dotYearInputAttrs({ editing: true, initialDotYear: 1975, value: "", ...RANGE });
  assert.deepEqual(a, { required: false });
});

test("edit: changed value brings min/max back", () => {
  const a = dotYearInputAttrs({ editing: true, initialDotYear: 1975, value: "1980", ...RANGE });
  assert.deepEqual(a, { required: false, min: 1990, max: 2027 });
});

test("edit: listing with no stored year validates any entered value", () => {
  const a = dotYearInputAttrs({ editing: true, initialDotYear: null, value: "2022", ...RANGE });
  assert.equal(a.min, 1990);
});
