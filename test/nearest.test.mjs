import { test } from "node:test";
import assert from "node:assert/strict";
import { nearestFirst, BROWARD } from "../lib/nearest.js";

const L = (id, lat, lng) => ({ id, lat, lng });
// newest first: Orlando, Miami, no coords, Coral Springs, Tampa, Fort Lauderdale
const pool = [L("orl", 28.5383, -81.3792), L("mia", 25.7617, -80.1918), L("none", null, null),
  L("cs", 26.2712, -80.2706), L("tpa", 27.9506, -82.4572), L("ftl", 26.1224, -80.1373)];

test("nearest-first from a Coral Springs visitor", () => {
  assert.deepEqual(nearestFirst(pool, { lat: 26.2712, lng: -80.2706 }).map((l) => l.id), ["cs", "ftl", "mia", "orl"]);
});

test("falls back to Broward when the origin is missing or bad", () => {
  const ids = ["ftl", "cs", "mia", "orl"];
  assert.deepEqual(nearestFirst(pool, null).map((l) => l.id), ids);
  assert.deepEqual(nearestFirst(pool, { lat: "x", lng: 1 }).map((l) => l.id), ids);
  assert.deepEqual(nearestFirst(pool, BROWARD).map((l) => l.id), ids);
});

test("listings without coordinates sink but still show when nothing else is left", () => {
  assert.deepEqual(nearestFirst(pool, BROWARD, 6).map((l) => l.id).slice(-1), ["none"]);
});

test("equal distance keeps recency order (stable)", () => {
  const same = [L("new", 26, -80), L("old", 26, -80)];
  assert.deepEqual(nearestFirst(same, BROWARD).map((l) => l.id), ["new", "old"]);
});

test("inside a band, featured then seller-plan sets lead; a far featured set never beats a local one", () => {
  const p = [L("near-plain", 26.13, -80.14), { ...L("near-pro", 26.2, -80.25), sellerPro: true },
    { ...L("near-feat", 26.25, -80.27), featured: true }, { ...L("orl-feat", 28.5383, -81.3792), featured: true }];
  assert.deepEqual(nearestFirst(p, BROWARD).map((l) => l.id), ["near-feat", "near-pro", "near-plain", "orl-feat"]);
});
