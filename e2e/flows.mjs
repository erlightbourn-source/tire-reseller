// End-to-end happy-path tests: boot the built Next app and exercise the real
// HTTP flows (health, browse, signup/verify gating, CSRF, seeded login).
// No extra deps — node:test + fetch + a spawned `next start`.
//
// Run with:  npm run test:e2e   (after `npm run build`)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const PORT = 3399;
const BASE = `http://localhost:${PORT}`;
const DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
let server;

// Direct DB handle for the one thing the HTTP surface deliberately won't do:
// hand back an email-verification token (see app/api/auth/verify — the token
// only ever leaves the server inside the sent email). There's no dev-only
// email outbox yet (tracked as BACKLOG #3b), so the funnel test below bypasses
// verification the same way the real /api/auth/verify route resolves it —
// flipping emailVerified and clearing the token columns directly.
const db = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

before(async () => {
  server = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    {
      env: {
        ...process.env,
        APP_SECRET: process.env.APP_SECRET || "e2e_test_secret_thirty_two_chars_minimum",
        DATABASE_URL,
        NODE_ENV: "production",
      },
      stdio: "ignore",
    }
  );
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("E2E: server did not become ready");
});

after(async () => {
  server?.kill();
  await db.$disconnect();
});

const req = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    headers: { Origin: BASE, "Content-Type": "application/json", ...(opts.headers || {}) },
    redirect: "manual",
    ...opts,
  });

// Pull the session cookie off a login response so later requests can carry it.
function sessionCookie(res) {
  const raw = res.headers.get("set-cookie") || "";
  const m = raw.match(/tt_session=[^;]+/);
  return m ? m[0] : null;
}

// Same-effect shortcut for what clicking the emailed verify link does.
async function verifyByEmail(email) {
  await db.user.updateMany({
    where: { email },
    data: { emailVerified: true, verifyTokenHash: null, verifyTokenExpiry: null },
  });
}

async function signUpVerifiedAndLogin(email, password, role) {
  await req("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: role === "seller" ? "E2E Seller" : "E2E Buyer", email, password, role, location: "Miami, FL", agreedToTerms: true }),
  });
  await verifyByEmail(email);
  const login = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert.equal(login.status, 200, `${role} logs in after verification`);
  const cookie = sessionCookie(login);
  assert.ok(cookie, `${role} session cookie issued`);
  return cookie;
}

test("health endpoint reports DB up", async () => {
  const r = await req("/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

// app/sellers/[id]/page.js used `include` (whole-row fetch) instead of `select`
// on an anonymously-viewable page — passwordHash/resetTokenHash/email/
// stripeCustomerId were fetched server-side but never actually rendered (RSC
// only serializes fields the JSX reads), so this was latent, not a live leak;
// confirmed this test passes on the pre-fix `include` code too. The `select`
// fix is defense-in-depth: those columns are no longer fetched AT ALL, so a
// future JSX change can no longer accidentally render one. This test doesn't
// prove today's behavior changed — it guards against that future refactor.
test("seller profile page never leaks passwordHash into the rendered page", async () => {
  const seller = await db.user.findFirst({ where: { role: "seller" }, select: { id: true, passwordHash: true } });
  assert.ok(seller, "at least one seeded seller exists");
  const r = await req(`/sellers/${seller.id}`);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.ok(!html.includes(seller.passwordHash), "passwordHash string is absent from the response body");
});

test("browse renders listings", async () => {
  const r = await req("/browse");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /tire set/i);
});

test("seeded (verified) user can log in", async () => {
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "demo@tiretrader.test", password: "demo1234" }) });
  assert.equal(r.status, 200);
});

test("signup is neutral and login is blocked until verified", async () => {
  const email = `e2e${Date.now()}@example.com`;
  const password = "Zx9-e2e-uncommon-pass-7q";
  const s = await req("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "E2E", email, password, role: "buyer", agreedToTerms: true }) });
  assert.equal(s.status, 200, "signup returns neutral 200");
  const l = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert.equal(l.status, 403, "unverified login blocked");
  assert.equal((await l.json()).code, "verify_email");
});

test("signup without agreeing to terms is rejected", async () => {
  const email = `e2e${Date.now()}-noconsent@example.com`;
  const password = "Zx9-e2e-uncommon-pass-7q";
  const s = await req("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "E2E", email, password, role: "buyer" }) });
  assert.equal(s.status, 400, "signup blocked without agreedToTerms");
  const l = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert.equal(l.status, 401, "no account was created");
});

test("wrong password is rejected", async () => {
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "demo@tiretrader.test", password: "nope" }) });
  assert.equal(r.status, 401);
});

test("CSRF: cross-origin mutation is blocked", async () => {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(r.status, 403);
});

test("cron endpoint fails closed without the secret", async () => {
  const r = await req("/api/cron/purge");
  assert.equal(r.status, 401);
});

// /api/cron/alerts shares the same bearerMatches() fail-closed gate as
// /api/cron/purge above, but only purge had a regression test locking the
// behavior in — a change to lib/security.js could silently open the alerts
// digest endpoint without either test noticing. Cover both call sites.
test("cron alerts endpoint also fails closed without the secret", async () => {
  const r = await req("/api/cron/alerts");
  assert.equal(r.status, 401);
});

// Per-recipient email caps (3/hour, keyed on the normalized address) on the
// reset/verification senders, so an IP-rotating attacker can't bomb one inbox.
// Each test stays within its route's 5/min per-IP budget (exactly 5 requests).
test("forgot: 4th same-address request within the hour is capped, others unaffected", async () => {
  const addr = `cap${Date.now()}@example.com`;
  const post = (email) =>
    req("/api/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
  for (let i = 0; i < 3; i++) {
    const r = await post(addr);
    assert.equal(r.status, 200, `request ${i + 1} passes`);
    assert.equal((await r.json()).ok, true, "neutral body");
  }
  const fourth = await post(addr);
  assert.equal(fourth.status, 429, "4th same-address request is capped");
  assert.ok(Number(fourth.headers.get("retry-after")) > 0, "Retry-After present");
  const other = await post(`other${Date.now()}@example.com`);
  assert.equal(other.status, 200, "a different address is not affected");
});

// Signup mails the address owner even when the account already exists ("You
// already have a TireKind account"), so it needs the same per-recipient cap as
// forgot/resend — applied before the existence lookup, and not reset by
// rotating the client IP.
test("signup: 4th same-address request within the hour is capped even across IPs", async () => {
  const addr = `capsignup${Date.now()}@example.com`;
  const password = "Zx9-e2e-uncommon-pass-7q";
  const post = (email, n) =>
    req("/api/auth/signup", {
      method: "POST",
      headers: { "X-Real-IP": `198.18.0.${n}` }, // a fresh per-IP bucket every time
      body: JSON.stringify({ name: "E2E", email, password, role: "buyer", agreedToTerms: true }),
    });
  // 1st creates the (unverified) account; 2nd-3rd hit the "already exists" branch.
  for (let i = 1; i <= 3; i++) {
    const r = await post(addr, i);
    assert.equal(r.status, 200, `request ${i} passes`);
    assert.deepEqual(await r.json(), { ok: true, pending: true }, "neutral body");
  }
  const fourth = await post(addr, 4);
  assert.equal(fourth.status, 429, "4th same-address signup is capped despite a new IP");
  const other = await post(`othersignup${Date.now()}@example.com`, 5);
  assert.equal(other.status, 200, "a different address is not affected");
});

test("resend-verification: 4th same-address request capped; response neutral for existing accounts", async () => {
  const addr = `capv${Date.now()}@example.com`;
  const post = (email) =>
    req("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
  for (let i = 0; i < 3; i++) assert.equal((await post(addr)).status, 200);
  const fourth = await post(addr);
  assert.equal(fourth.status, 429, "4th same-address request is capped");
  // Existence-oracle check: a real (verified) account gets the same neutral
  // 200 {ok:true} a nonexistent address gets.
  const existing = await post("demo@tiretrader.test");
  assert.equal(existing.status, 200);
  assert.deepEqual(await existing.json(), { ok: true });
});

// The core funnel (BACKLOG #4): signup -> verify -> list a tire -> a buyer
// messages the seller -> negotiates an offer -> seller accepts -> the listing
// is marked sold. Also exercises thread authorization (a non-participant is
// denied) and the accept route's already-answered guard along the way.
test("core funnel: seller lists a tire, buyer offers, seller accepts", async () => {
  const stamp = Date.now();
  const password = "Zx9-e2e-uncommon-pass-7q";
  const sellerEmail = `e2eseller${stamp}@example.com`;
  const buyerEmail = `e2ebuyer${stamp}@example.com`;
  const strangerEmail = `e2estranger${stamp}@example.com`;

  const sellerCookie = await signUpVerifiedAndLogin(sellerEmail, password, "seller");
  const listingRes = await req("/api/listings", {
    method: "POST",
    headers: { Cookie: sellerCookie },
    body: JSON.stringify({ brand: "E2E Brand", size: "225/45R17", location: "Miami, FL", condition: "new", price: 400, quantity: 4, treadDepth: "new", dotYear: 2025 }),
  });
  assert.equal(listingRes.status, 200, "seller creates a listing");
  const { id: listingId } = await listingRes.json();
  assert.ok(listingId, "listing id returned");

  const buyerCookie = await signUpVerifiedAndLogin(buyerEmail, password, "buyer");
  const threadRes = await req("/api/threads", {
    method: "POST",
    headers: { Cookie: buyerCookie },
    body: JSON.stringify({ listingId, message: "Is this still available?" }),
  });
  assert.equal(threadRes.status, 200, "buyer opens a thread on the listing");
  const { threadId } = await threadRes.json();
  assert.ok(threadId, "thread id returned");

  // Authorization: an unrelated verified user can't read this thread.
  const strangerCookie = await signUpVerifiedAndLogin(strangerEmail, password, "buyer");
  const strangerRead = await req(`/api/messages/${threadId}`, { headers: { Cookie: strangerCookie } });
  assert.equal(strangerRead.status, 403, "non-participant is denied thread access");

  const offerRes = await req(`/api/messages/${threadId}`, {
    method: "POST",
    headers: { Cookie: buyerCookie },
    body: JSON.stringify({ kind: "offer", offerCents: 35000, body: "Would you take $350?" }),
  });
  assert.equal(offerRes.status, 200, "buyer sends an offer");
  const { id: offerMessageId } = await offerRes.json();
  assert.ok(offerMessageId, "offer message id returned");

  const sellerRead = await req(`/api/messages/${threadId}`, { headers: { Cookie: sellerCookie } });
  assert.equal(sellerRead.status, 200);
  const sellerView = await sellerRead.json();
  assert.equal(sellerView.isSeller, true, "seller side of the thread is flagged correctly");
  const offerMsg = sellerView.messages.find((m) => m.id === offerMessageId);
  assert.equal(offerMsg?.kind, "offer");
  assert.equal(offerMsg?.offerStatus, "pending");

  const acceptRes = await req("/api/offers", {
    method: "POST",
    headers: { Cookie: sellerCookie },
    body: JSON.stringify({ messageId: offerMessageId, action: "accept" }),
  });
  assert.equal(acceptRes.status, 200, "seller accepts the offer");

  const sold = await db.listing.findUnique({ where: { id: listingId }, select: { status: true } });
  assert.equal(sold?.status, "sold", "accepting an offer marks the listing sold");

  // Atomic-transition guard: a second accept on the same, already-answered
  // offer must not re-fire (prevents a double-sale race).
  const doubleAccept = await req("/api/offers", {
    method: "POST",
    headers: { Cookie: sellerCookie },
    body: JSON.stringify({ messageId: offerMessageId, action: "accept" }),
  });
  assert.equal(doubleAccept.status, 409, "re-accepting an already-answered offer is rejected");
});

// A block must stop the offer actions too, not just plain messages: the seller
// counters, then blocks the buyer; the blocked buyer must not be able to accept
// that counter (which would post into the thread AND mark the listing sold).
test("offers: a blocked party can't accept/counter a pending offer", async () => {
  const stamp = Date.now();
  const password = "Zx9-e2e-uncommon-pass-7q";
  // Separate client IP bucket so this test's signups/logins don't trip the
  // per-IP signup/login limits consumed by the tests above.
  const ip = { "X-Real-IP": "203.0.113.77" };
  const signIn = async (email, role) => {
    await req("/api/auth/signup", {
      method: "POST",
      headers: ip,
      body: JSON.stringify({ name: `E2E ${role}`, email, password, role, location: "Miami, FL", agreedToTerms: true }),
    });
    await verifyByEmail(email);
    const login = await req("/api/auth/login", { method: "POST", headers: ip, body: JSON.stringify({ email, password }) });
    assert.equal(login.status, 200, `${role} logs in`);
    return sessionCookie(login);
  };
  const sellerCookie = await signIn(`e2eblkseller${stamp}@example.com`, "seller");
  const buyerCookie = await signIn(`e2eblkbuyer${stamp}@example.com`, "buyer");

  const { id: listingId } = await (await req("/api/listings", {
    method: "POST",
    headers: { Cookie: sellerCookie },
    body: JSON.stringify({ brand: "E2E Block", size: "205/55R16", location: "Miami, FL", condition: "used", price: 200, quantity: 4, treadDepth: "6/32in", dotYear: 2022 }),
  })).json();
  const { threadId } = await (await req("/api/threads", {
    method: "POST",
    headers: { Cookie: buyerCookie },
    body: JSON.stringify({ listingId, message: "Hi" }),
  })).json();
  const { id: buyerOfferId } = await (await req(`/api/messages/${threadId}`, {
    method: "POST",
    headers: { Cookie: buyerCookie },
    body: JSON.stringify({ kind: "offer", offerCents: 15000 }),
  })).json();

  const counter = await req("/api/offers", {
    method: "POST",
    headers: { Cookie: sellerCookie },
    body: JSON.stringify({ messageId: buyerOfferId, action: "counter", offerCents: 18000 }),
  });
  assert.equal(counter.status, 200, "seller counters (pre-block)");
  const counterMsg = await db.message.findFirst({
    where: { threadId, kind: "offer", offerStatus: "pending" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  assert.ok(counterMsg, "seller's counter is pending");

  const seller = await db.user.findUnique({ where: { email: `e2eblkseller${stamp}@example.com` }, select: { id: true } });
  const buyer = await db.user.findUnique({ where: { email: `e2eblkbuyer${stamp}@example.com` }, select: { id: true } });
  const block = await req("/api/block", { method: "POST", headers: { Cookie: sellerCookie }, body: JSON.stringify({ userId: buyer.id }) });
  assert.equal(block.status, 200, "seller blocks the buyer");
  assert.ok(seller.id);

  for (const action of ["accept", "counter"]) {
    const r = await req("/api/offers", {
      method: "POST",
      headers: { Cookie: buyerCookie },
      body: JSON.stringify({ messageId: counterMsg.id, action, offerCents: 16000 }),
    });
    assert.equal(r.status, 403, `blocked buyer can't ${action}`);
  }
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { status: true } });
  assert.equal(listing?.status, "active", "listing was NOT marked sold by the blocked party");
  const still = await db.message.findUnique({ where: { id: counterMsg.id }, select: { offerStatus: true } });
  assert.equal(still?.offerStatus, "pending", "counter-offer left untouched");
});

// L1674: new listings must carry tread depth + DOT year, and the speed rating must be
// a real speed symbol (a seller once typed "130" mph, which rendered as "102130").
// PATCH on an existing listing stays lenient about missing fields but validates what it gets.
test("listing proof fields: POST requires treadDepth + dotYear, validates speedRating; PATCH validates if provided", async () => {
  // Seeded seller: the signup endpoint is capped at 5/min per IP and earlier tests already use 5.
  const login = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "demo@tiretrader.test", password: "demo1234" }) });
  assert.equal(login.status, 200, "seeded seller logs in");
  const cookie = sessionCookie(login);
  const base = { brand: "E2E Proof", size: "225/65R17", location: "Miami, FL", condition: "used", price: 250, quantity: 4, treadDepth: "8/32in", dotYear: 2022 };
  const post = (over, drop = []) => {
    const body = { ...base, ...over };
    for (const k of drop) delete body[k];
    return req("/api/listings", { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify(body) });
  };

  const noDot = await post({}, ["dotYear"]);
  assert.equal(noDot.status, 400, "missing dotYear -> 400");
  assert.match((await noDot.json()).error, /DOT year/);
  const noTread = await post({}, ["treadDepth"]);
  assert.equal(noTread.status, 400, "missing treadDepth -> 400");
  assert.match((await noTread.json()).error, /Tread depth/);
  assert.equal((await post({ dotYear: 1985 })).status, 400, "dotYear 1985 -> 400");
  assert.equal((await post({ dotYear: new Date().getFullYear() + 2 })).status, 400, "dotYear too far ahead -> 400");

  const mph = await post({ speedRating: "130" });
  assert.equal(mph.status, 400, "speedRating 130 -> 400");
  assert.match((await mph.json()).error, /Speed rating/);

  const ok = await post({ loadIndex: "102", speedRating: "h" });
  assert.equal(ok.status, 200, "valid listing is created");
  const { id } = await ok.json();
  const row = await db.listing.findUnique({ where: { id }, select: { speedRating: true, dotYear: true, treadDepth: true } });
  assert.deepEqual(row, { speedRating: "H", dotYear: 2022, treadDepth: "8/32in" });
  for (const sr of ["ZR", "(Y)"]) assert.equal((await post({ speedRating: sr })).status, 200, `speedRating ${sr} ok`);
  assert.equal((await post({}, ["speedRating"])).status, 200, "speedRating stays optional");

  // Rendered page: "102 H" with a space.
  const html = await (await req(`/listings/${id}`)).text();
  assert.match(html, /102 H/);
  assert.ok(!html.includes("102H"));

  // PATCH: partial edit without the proof fields still works; provided-but-bad values are rejected.
  const patch = (body) => req(`/api/listings/${id}`, { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify(body) });
  assert.equal((await patch({ price: 240 })).status, 200, "PATCH without proof fields is fine");
  assert.equal((await patch({ speedRating: "130" })).status, 400, "PATCH speedRating 130 -> 400");
  assert.equal((await patch({ dotYear: 1985 })).status, 400, "PATCH dotYear 1985 -> 400");
  assert.equal((await patch({ speedRating: "V", dotYear: "2023" })).status, 200, "PATCH valid values");
  const after = await db.listing.findUnique({ where: { id }, select: { speedRating: true, dotYear: true } });
  assert.deepEqual(after, { speedRating: "V", dotYear: 2023 });

  // Legacy row with garbage stored speed renders only the load index.
  await db.listing.update({ where: { id }, data: { speedRating: "130" } });
  const legacy = await (await req(`/listings/${id}`)).text();
  assert.ok(!legacy.includes("102130"), "never renders 102130");
  assert.ok(!legacy.includes("102 130"));
});

// L1421 founding-seller path: the page's CTAs go to seller signup for visitors
// and to /dashboard for logged-in users (never /subscribe or /sell-tires), and a
// freshly verified seller's login reports role=seller so AuthForm lands them on
// /dashboard, which renders for them instead of bouncing to /login.
test("founding-seller CTAs: signup for visitors, dashboard when logged in; seller login lands on dashboard", async () => {
  const claimHrefs = (html) =>
    [...html.matchAll(/<a\s([^>]*)>Claim[^<]*</g)].map((m) => m[1].match(/href="([^"]*)"/)?.[1]);

  const anon = await (await req("/founding-seller")).text();
  const anonHrefs = claimHrefs(anon);
  assert.equal(anonHrefs.length, 2, "both Claim CTAs render");
  assert.deepEqual(anonHrefs, ["/signup?role=seller", "/signup?role=seller"], "visitor CTAs go to seller signup");

  const email = `e2e${Date.now()}-founder@example.com`;
  const password = "Zx9-e2e-uncommon-pass-7q";
  const ip = { "X-Real-IP": "203.0.113.88" }; // own rate-limit bucket: earlier tests spend the shared per-IP signup budget
  await req("/api/auth/signup", {
    method: "POST",
    headers: ip,
    body: JSON.stringify({ name: "E2E Founder", email, password, role: "seller", location: "Miami, FL", agreedToTerms: true }),
  });
  await verifyByEmail(email);
  const login = await req("/api/auth/login", { method: "POST", headers: ip, body: JSON.stringify({ email, password }) });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).role, "seller", "login response carries the role");
  const cookie = sessionCookie(login);

  const authed = await (await req("/founding-seller", { headers: { Cookie: cookie } })).text();
  assert.deepEqual(claimHrefs(authed), ["/dashboard", "/dashboard"], "logged-in CTAs go to the dashboard");

  const dash = await req("/dashboard", { headers: { Cookie: cookie } });
  assert.equal(dash.status, 200, "new seller sees the dashboard, not a redirect");
});

// L1674 (review fix): bulk add holds new listings to the same proof-field rule as a
// single listing: a line without tread depth or a valid DOT year is skipped with a reason.
test("bulk add: lines need tread depth + DOT year; valid lines store them", async () => {
  const login = await req("/api/auth/login", { method: "POST", headers: { "X-Real-IP": "203.0.113.89" }, body: JSON.stringify({ email: "mike@tiretrader.test", password: "seller1234" }) });
  assert.equal(login.status, 200, "seeded pro seller logs in");
  const cookie = sessionCookie(login);
  const text = [
    "E2E Bulk | 225/45R17 | 320 | 4 | used | Dallas, TX | 7/32 | 2022",
    "E2E Bulk | 225/45R17 | 320 | 4 | used | Dallas, TX",
    "E2E Bulk | 225/45R17 | 320 | 4 | used | Dallas, TX | 7/32",
    "E2E Bulk | 225/45R17 | 320 | 4 | used | Dallas, TX | 7/32 | 1985",
  ].join("\n");
  const res = await req("/api/listings/bulk", { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ text }) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.count, 1, "only the complete line is created");
  assert.equal(data.errors.length, 3);
  assert.match(data.errors[0], /^Line 2: Tread depth/);
  assert.match(data.errors[1], /^Line 3: DOT year is required/);
  assert.match(data.errors[2], /^Line 4: DOT year must be/);
  const row = await db.listing.findFirst({ where: { brand: "E2E Bulk" }, orderBy: { createdAt: "desc" }, select: { treadDepth: true, dotYear: true, treadDepth32: true } });
  assert.equal(row.treadDepth, "7/32");
  assert.equal(row.dotYear, 2022);
  assert.equal(row.treadDepth32, 7);
});
