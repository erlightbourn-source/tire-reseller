// Decides whether a retrieved Stripe Checkout Session may flip the signed-in
// user to an active plan (app/subscribe/success). Pure, so it can be tested
// without Stripe. A session_id sits in browser history and the receipt email
// forever, so replaying an old one must never re-activate a cancelled plan:
// the session's subscription has to be live RIGHT NOW (expanded, status
// active/trialing) and belong to this user's Stripe customer and this user.
// The page never downgrades — the webhook owns that.

const LIVE = new Set(["active", "trialing"]);

function idOf(v) {
  return typeof v === "string" ? v : v && typeof v === "object" ? v.id || null : null;
}

export function checkoutActivation(session, user) {
  if (!session || !user) return { activate: false, reason: "missing" };
  if (!user.id || session.client_reference_id !== user.id) return { activate: false, reason: "wrong_user" };
  if (!(session.payment_status === "paid" || session.status === "complete")) {
    return { activate: false, reason: "incomplete" };
  }
  const sub = session.subscription;
  if (!sub || typeof sub !== "object") return { activate: false, reason: "no_subscription" };
  if (!LIVE.has(sub.status)) return { activate: false, reason: "subscription_not_live" };
  const customer = idOf(session.customer);
  if (!customer || !user.stripeCustomerId || customer !== user.stripeCustomerId) {
    return { activate: false, reason: "wrong_customer" };
  }
  const subCustomer = idOf(sub.customer);
  if (subCustomer && subCustomer !== customer) return { activate: false, reason: "wrong_customer" };
  return { activate: true, reason: "ok", customer };
}
