import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FOUNDING_SEATS, FOUNDING_MONTHLY, STANDARD_MONTHLY,
  priceFor, resolvePriceId, priceConfigState, foundingSpotsLine, PLAN_COPY,
} from "../lib/pricing.js";

test("priceFor: founding sellers get the locked founding price, everyone else standard", () => {
  const f = priceFor({ foundingSeller: true });
  assert.equal(f.tier, "founding");
  assert.equal(f.monthly, FOUNDING_MONTHLY);
  assert.equal(f.label, `$${FOUNDING_MONTHLY}/month`);
  assert.equal(f.locked, true);

  for (const u of [{ foundingSeller: false }, { pro: true }, {}, null, undefined]) {
    const s = priceFor(u);
    assert.equal(s.tier, "standard");
    assert.equal(s.monthly, STANDARD_MONTHLY);
    assert.equal(s.label, `$${STANDARD_MONTHLY}/month`);
    assert.equal(s.locked, false);
  }
});

test("resolvePriceId: tier-specific ids win over the legacy STRIPE_PRICE_ID", () => {
  const env = { STRIPE_PRICE_FOUNDING: "price_f", STRIPE_PRICE_STANDARD: "price_s", STRIPE_PRICE_ID: "price_legacy" };
  assert.equal(resolvePriceId("founding", env), "price_f");
  assert.equal(resolvePriceId("standard", env), "price_s");
  assert.equal(priceConfigState(env), "tiered");
});

test("resolvePriceId: falls back to STRIPE_PRICE_ID when a tier id is unset or a placeholder", () => {
  const legacyOnly = { STRIPE_PRICE_ID: "price_legacy" };
  assert.equal(resolvePriceId("founding", legacyOnly), "price_legacy");
  assert.equal(resolvePriceId("standard", legacyOnly), "price_legacy");
  assert.equal(priceConfigState(legacyOnly), "legacy");

  const placeholder = { STRIPE_PRICE_FOUNDING: "price_REPLACE_ME", STRIPE_PRICE_ID: "price_legacy" };
  assert.equal(resolvePriceId("founding", placeholder), "price_legacy");

  const partial = { STRIPE_PRICE_STANDARD: "price_s" };
  assert.equal(resolvePriceId("standard", partial), "price_s");
  assert.equal(resolvePriceId("founding", partial), null);
  assert.equal(priceConfigState(partial), "partial");

  assert.equal(resolvePriceId("standard", {}), null);
  assert.equal(resolvePriceId("standard", { STRIPE_PRICE_ID: "price_REPLACE_ME" }), null);
  assert.equal(priceConfigState({}), "none");
});

test("resolvePriceId/priceConfigState: 'mixed' config — one tier id set alongside the legacy id — silently bills the other tier at the legacy price (locks in the documented risk, doesn't fix it)", () => {
  const foundingOnlyPlusLegacy = { STRIPE_PRICE_FOUNDING: "price_f", STRIPE_PRICE_ID: "price_legacy" };
  assert.equal(priceConfigState(foundingOnlyPlusLegacy), "mixed");
  assert.equal(resolvePriceId("founding", foundingOnlyPlusLegacy), "price_f");
  // Standard has no id of its own, so it falls through to the legacy price —
  // exactly the silent-mismatch scenario priceConfigState's "mixed" branch warns about.
  assert.equal(resolvePriceId("standard", foundingOnlyPlusLegacy), "price_legacy");

  const standardOnlyPlusLegacy = { STRIPE_PRICE_STANDARD: "price_s", STRIPE_PRICE_ID: "price_legacy" };
  assert.equal(priceConfigState(standardOnlyPlusLegacy), "mixed");
  assert.equal(resolvePriceId("standard", standardOnlyPlusLegacy), "price_s");
  assert.equal(resolvePriceId("founding", standardOnlyPlusLegacy), "price_legacy");
});

test("foundingSpotsLine: renders the counter, caps at the seat count, null when unknown", () => {
  assert.equal(foundingSpotsLine(7), `7 of ${FOUNDING_SEATS} founding spots claimed`);
  assert.equal(foundingSpotsLine(0), `0 of ${FOUNDING_SEATS} founding spots claimed`);
  assert.equal(foundingSpotsLine(FOUNDING_SEATS + 3), `${FOUNDING_SEATS} of ${FOUNDING_SEATS} founding spots claimed`);
  assert.equal(foundingSpotsLine(null), null);
  assert.equal(foundingSpotsLine(NaN), null);
  assert.equal(foundingSpotsLine(-1), null);
});

test("PLAN_COPY: the founding story carries both prices and the seat count; nothing says 'first year'", () => {
  assert.match(PLAN_COPY.foundingStory, new RegExp(`first ${FOUNDING_SEATS} `));
  assert.match(PLAN_COPY.foundingStory, new RegExp(`\\$${FOUNDING_MONTHLY}/month`));
  assert.match(PLAN_COPY.foundingStory, new RegExp(`\\$${STANDARD_MONTHLY}/month`));
  for (const v of Object.values(PLAN_COPY)) assert.doesNotMatch(v, /first year|year one/i);
});
