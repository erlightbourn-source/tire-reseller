import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { showSizeAlert } from "../lib/sizeAlert.js";

// L1636: PR #61 shows ListingSizeAlert to logged-OUT buyers only. Nothing proved a
// signed-in viewer does NOT get it. The listing page is a server component (JSX + "@/" imports,
// no JSX loader in node --test), so the guard lives in a pure helper and a wiring test
// checks the page renders the component only through that helper.

test("logged-out viewer (no user) sees the size alert", () => {
  assert.equal(showSizeAlert(null), true);
  assert.equal(showSizeAlert(undefined), true);
});

test("logged-in viewer does NOT see the size alert", () => {
  assert.equal(showSizeAlert({ id: "u1", name: "Sam" }), false);
  assert.equal(showSizeAlert({ id: "u2" }), false);
});

test("listing page renders ListingSizeAlert only behind showSizeAlert(user)", () => {
  const src = readFileSync(new URL("../app/listings/[id]/page.js", import.meta.url), "utf8");
  assert.match(src, /import \{ showSizeAlert \} from "@\/lib\/sizeAlert"/);
  const uses = src.match(/<ListingSizeAlert\b/g) || [];
  assert.equal(uses.length, 1, "exactly one ListingSizeAlert render site");
  assert.match(src, /\{showSizeAlert\(user\) && <ListingSizeAlert size=\{listing\.size\} \/>\}/);
});
