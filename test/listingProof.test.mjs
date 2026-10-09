import { test } from "node:test";
import assert from "node:assert/strict";
import { ValidationError } from "../lib/validation.js";
import {
  SPEED_RATINGS,
  normalizeSpeedRating,
  isValidSpeedRating,
  parseDotYear,
  requireTreadDepth,
  formatLoadSpeed,
} from "../lib/listingProof.js";

const NOW = new Date("2026-10-09T12:00:00Z");

/* ------------------------------- dotYear ------------------------------- */

test("parseDotYear: required and missing -> ValidationError naming the field", () => {
  for (const v of [undefined, null, "", "   "]) {
    assert.throws(() => parseDotYear(v, { required: true, now: NOW }), (e) => e instanceof ValidationError && /DOT year/.test(e.message));
  }
});

test("parseDotYear: 1985 is rejected (before 1990)", () => {
  assert.throws(() => parseDotYear(1985, { required: true, now: NOW }), (e) => e instanceof ValidationError && /1990/.test(e.message));
});

test("parseDotYear: current year + 1 is the ceiling", () => {
  assert.equal(parseDotYear(2027, { required: true, now: NOW }), 2027);
  assert.throws(() => parseDotYear(2028, { required: true, now: NOW }), ValidationError);
});

test("parseDotYear: accepts numeric strings from the form, rejects non-integers and junk", () => {
  assert.equal(parseDotYear("2021", { required: true, now: NOW }), 2021);
  assert.equal(parseDotYear(1990, { required: true, now: NOW }), 1990);
  for (const v of ["2021.5", "abc", "21", "2e3", NaN, {}, []]) {
    assert.throws(() => parseDotYear(v, { required: true, now: NOW }), ValidationError, `reject ${String(v)}`);
  }
});

test("parseDotYear: optional (PATCH) -> empty is null, a provided value is still validated", () => {
  assert.equal(parseDotYear("", { now: NOW }), null);
  assert.equal(parseDotYear(null, { now: NOW }), null);
  assert.equal(parseDotYear(2021, { now: NOW }), 2021);
  assert.throws(() => parseDotYear(1985, { now: NOW }), ValidationError);
});

/* ------------------------------ treadDepth ----------------------------- */

test("requireTreadDepth: missing -> ValidationError naming Tread depth; present -> trimmed", () => {
  assert.throws(() => requireTreadDepth(undefined), (e) => e instanceof ValidationError && /Tread depth/.test(e.message));
  assert.throws(() => requireTreadDepth("  "), ValidationError);
  assert.equal(requireTreadDepth(" 8/32in "), "8/32in");
  assert.equal(requireTreadDepth("new"), "new");
});

/* ----------------------------- speed rating ---------------------------- */

test("speed rating: the letter set, ZR and parenthesised forms are valid and uppercased", () => {
  for (const s of ["L", "M", "N", "P", "Q", "R", "S", "T", "U", "H", "V", "W", "Y", "Z", "ZR", "(Y)", "(W)", "(ZR)"]) {
    assert.equal(normalizeSpeedRating(s), s);
    assert.ok(isValidSpeedRating(s));
  }
  assert.equal(normalizeSpeedRating(" h "), "H");
  assert.equal(normalizeSpeedRating("(zr)"), "(ZR)");
  assert.ok(SPEED_RATINGS.includes("H"));
});

test("speed rating: mph digits like '130' are rejected with a clear message", () => {
  assert.throws(
    () => normalizeSpeedRating("130"),
    (e) => e instanceof ValidationError && /Speed rating/.test(e.message) && /letter/.test(e.message)
  );
  for (const bad of ["H130", "A", "ZZ", "(H)", "(", "1", "VR", "<b>"]) {
    assert.throws(() => normalizeSpeedRating(bad), ValidationError, `reject ${bad}`);
  }
});

test("speed rating: empty is allowed (optional field) and normalises to null", () => {
  for (const v of [undefined, null, "", "  "]) assert.equal(normalizeSpeedRating(v), null);
});

/* --------------------------- load/speed display ------------------------- */

test("formatLoadSpeed: valid pair renders with a space", () => {
  assert.equal(formatLoadSpeed("102", "H"), "102 H");
  assert.equal(formatLoadSpeed("91", "(Y)"), "91 (Y)");
});

test("formatLoadSpeed: bad stored speed ('130') renders only the load index, never '102130'", () => {
  assert.equal(formatLoadSpeed("102", "130"), "102");
  assert.equal(formatLoadSpeed(null, "130"), null);
});

test("formatLoadSpeed: speed without load, and nothing at all", () => {
  assert.equal(formatLoadSpeed(null, "H"), "H");
  assert.equal(formatLoadSpeed("", ""), null);
  assert.equal(formatLoadSpeed("102", null), "102");
});
