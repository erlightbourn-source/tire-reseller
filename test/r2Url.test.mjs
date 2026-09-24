import { test } from "node:test";
import assert from "node:assert/strict";
import { buildR2Url } from "../lib/r2Url.js";

test("buildR2Url joins base + key and trims trailing slashes", () => {
  assert.equal(buildR2Url("https://uploads.example.com//", "a.jpg"), "https://uploads.example.com/uploads/a.jpg");
});

test("buildR2Url returns null when the public base is unset/blank, so callers fail loudly instead of storing a relative URL that 404s", () => {
  assert.equal(buildR2Url("", "a.jpg"), null);
  assert.equal(buildR2Url(undefined, "a.jpg"), null);
  assert.equal(buildR2Url("   ", "a.jpg"), null);
});

test("buildR2Url rejects a non-https base", () => {
  assert.equal(buildR2Url("http://uploads.example.com", "a.jpg"), null);
});
