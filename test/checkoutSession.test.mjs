import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutActivation } from "../lib/checkoutSession.js";

const user = { id: "u1", stripeCustomerId: "cus_1" };
const session = (over = {}) => ({
  client_reference_id: "u1",
  payment_status: "paid",
  status: "complete",
  customer: "cus_1",
  subscription: { id: "sub_1", status: "active", customer: "cus_1" },
  ...over,
});

test("live subscription for this user and customer activates", () => {
  assert.deepEqual(checkoutActivation(session(), user), { activate: true, reason: "ok", customer: "cus_1" });
});

test("trialing counts as live; expanded customer object is accepted", () => {
  const s = session({ customer: { id: "cus_1" }, subscription: { id: "sub_1", status: "trialing", customer: "cus_1" } });
  assert.equal(checkoutActivation(s, user).activate, true);
});

test("replayed session of a cancelled/lapsed subscription does NOT activate (F1)", () => {
  for (const status of ["canceled", "incomplete_expired", "past_due", "unpaid", "incomplete", "paused"]) {
    const r = checkoutActivation(session({ subscription: { id: "sub_1", status, customer: "cus_1" } }), user);
    assert.equal(r.activate, false, status);
    assert.equal(r.reason, "subscription_not_live");
  }
});

test("unexpanded or missing subscription does not activate", () => {
  assert.equal(checkoutActivation(session({ subscription: "sub_1" }), user).reason, "no_subscription");
  assert.equal(checkoutActivation(session({ subscription: null }), user).reason, "no_subscription");
});

test("someone else's session (reference id or customer mismatch) does not activate", () => {
  assert.equal(checkoutActivation(session({ client_reference_id: "u2" }), user).reason, "wrong_user");
  assert.equal(checkoutActivation(session({ customer: "cus_2" }), user).reason, "wrong_customer");
  assert.equal(
    checkoutActivation(session({ subscription: { id: "sub_1", status: "active", customer: "cus_2" } }), user).reason,
    "wrong_customer"
  );
});

test("user without a stored Stripe customer is never activated from the page", () => {
  assert.equal(checkoutActivation(session(), { id: "u1", stripeCustomerId: null }).reason, "wrong_customer");
});

test("unpaid/incomplete checkout does not activate", () => {
  assert.equal(checkoutActivation(session({ payment_status: "unpaid", status: "open" }), user).reason, "incomplete");
});

test("missing inputs are safe", () => {
  assert.equal(checkoutActivation(null, user).activate, false);
  assert.equal(checkoutActivation(session(), null).activate, false);
});
