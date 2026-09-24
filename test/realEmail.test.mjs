import { test } from "node:test";
import assert from "node:assert/strict";
import { isRealEmail, normEmail } from "../lib/realEmail.js";

test("isRealEmail: ordinary addresses count", () => {
  assert.equal(isRealEmail("jane.doe@gmail.com"), true);
  assert.equal(isRealEmail("  Bob@Yahoo.com "), true);
  assert.equal(isRealEmail("contest@outlook.com"), true); // 'test' inside a word is fine
});

test("isRealEmail: Evan, fleet and test addresses are excluded", () => {
  for (const e of [
    "erlightbourn@gmail.com", "e.r.lightbourn+tirekindtest@gmail.com", "ERLIGHTBOURN@googlemail.com",
    "elightbourn@gatelesis.com", "travelandfinancetips@gmail.com", "hello@tirekind.com",
    "dev@example.com", "x@mailinator.com", "a@foo.test", "b@bar.invalid",
    "test1@gmail.com", "canary@yahoo.com", "jane+test@gmail.com",
  ]) assert.equal(isRealEmail(e), false, e);
});

test("isRealEmail: malformed input is not real", () => {
  for (const e of ["", null, undefined, "no-at-sign", "@gmail.com"]) assert.equal(isRealEmail(e), false, String(e));
});

test("normEmail lowercases and trims for de-duplication", () => {
  assert.equal(normEmail(" A@B.com "), "a@b.com");
});
