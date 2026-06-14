import { test } from "node:test";
import assert from "node:assert/strict";
import { FITMENT, MAKES, modelsFor, trimsFor, yearsFor, sizeFor, fitmentFor } from "../lib/fitment.js";

test("catalog is populated", () => {
  assert.ok(MAKES.length >= 30);
  assert.ok(MAKES.includes("BMW"));
});

test("trim lists resolve", () => {
  assert.deepEqual(trimsFor("BMW", "5 Series"), ["530i", "540i", "M550i", "M5"]);
  assert.ok(modelsFor("BMW").includes("5 Series"));
});

test("fitmentFor returns staggered front/rear for the M5", () => {
  const fit = fitmentFor("BMW", "5 Series", "M5", 2022);
  assert.deepEqual(fit, { front: "275/35R20", rear: "285/35R20", staggered: true });
});

test("square fitments report staggered:false with equal front/rear", () => {
  const fit = fitmentFor("BMW", "5 Series", "530i", 2020);
  assert.equal(fit.front, fit.rear);
  assert.equal(fit.staggered, false);
});

test("generation split picks the right size by year", () => {
  assert.equal(sizeFor("BMW", "3 Series", "330i", 2015), "225/45R17");
  assert.equal(sizeFor("BMW", "3 Series", "330i", 2021), "225/45R18");
});

test("unknown selections return empty/null", () => {
  assert.deepEqual(yearsFor("BMW", "Nope", "Nope"), []);
  assert.equal(sizeFor("Nope", "Nope", "Nope", 2020), null);
  assert.equal(fitmentFor("BMW", "5 Series", "Nope", 2020), null);
});

test("every size entry is a well-formed tire size", () => {
  const re = /^\d{3}\/\d{2}R\d{2}$/;
  for (const mk of MAKES)
    for (const md of modelsFor(mk))
      for (const tr of trimsFor(mk, md)) {
        assert.ok(yearsFor(mk, md, tr).length > 0, `${mk} ${md} ${tr} has no years`);
        for (const g of FITMENT[mk][md][tr]) {
          assert.match(g.size, re, `${mk} ${md} ${tr} front ${g.size}`);
          if (g.rear) assert.match(g.rear, re, `${mk} ${md} ${tr} rear ${g.rear}`);
        }
      }
});
