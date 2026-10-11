import { test } from "node:test";
import assert from "node:assert/strict";
import { buildListingBody } from "../lib/listingBody.js";
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
