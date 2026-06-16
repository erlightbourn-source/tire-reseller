import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTireSize, deriveListingColumns, sizeWhere } from "../lib/tiresize.js";

test("parseTireSize: full metric sizes", () => {
  assert.deepEqual(parseTireSize("245/40R19"), { width: 245, aspect: 40, rim: 19 });
  assert.deepEqual(parseTireSize("P245/40ZR19"), { width: 245, aspect: 40, rim: 19 });
  assert.deepEqual(parseTireSize("LT265/70R17"), { width: 265, aspect: 70, rim: 17 });
  assert.deepEqual(parseTireSize("275/55 R20"), { width: 275, aspect: 55, rim: 20 });
});

test("parseTireSize: partial inputs", () => {
  assert.deepEqual(parseTireSize("R19"), { width: null, aspect: null, rim: 19 });
  assert.deepEqual(parseTireSize("19"), { width: null, aspect: null, rim: 19 });
  assert.deepEqual(parseTireSize("245"), { width: 245, aspect: null, rim: null });
});

test("parseTireSize: junk → all null", () => {
  assert.deepEqual(parseTireSize("goodyear"), { width: null, aspect: null, rim: null });
  assert.deepEqual(parseTireSize(""), { width: null, aspect: null, rim: null });
  assert.deepEqual(parseTireSize("99"), { width: null, aspect: null, rim: null }, "out-of-range rim");
});

test("deriveListingColumns: size + tread + per-tire price", () => {
  const cols = deriveListingColumns({ size: "245/40R19", treadDepth: "8/32in", priceCents: 92000, quantity: 4 });
  assert.equal(cols.widthMm, 245);
  assert.equal(cols.aspectRatio, 40);
  assert.equal(cols.rimDiameter, 19);
  assert.equal(cols.treadDepth32, 8);
  assert.equal(cols.perTireCents, 23000);
});

test("deriveListingColumns: 'new' tread + missing values", () => {
  const cols = deriveListingColumns({ size: "R17", treadDepth: "new", priceCents: 30000, quantity: 4 });
  assert.equal(cols.rimDiameter, 17);
  assert.equal(cols.widthMm, null);
  assert.equal(cols.treadDepth32, 10, "'new' → 10/32");
  assert.equal(cols.perTireCents, 7500);
  assert.equal(deriveListingColumns({ size: "x", treadDepth: null, priceCents: 100, quantity: 1 }).treadDepth32, null);
});

test("sizeWhere: structured for parseable, substring fallback otherwise", () => {
  assert.deepEqual(sizeWhere("245/40R19"), { widthMm: 245, aspectRatio: 40, rimDiameter: 19 });
  assert.deepEqual(sizeWhere("R19"), { rimDiameter: 19 });
  assert.deepEqual(sizeWhere("bald set"), { size: { contains: "bald set" } });
});
