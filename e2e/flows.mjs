// End-to-end happy-path tests: boot the built Next app and exercise the real
// HTTP flows (health, browse, signup/verify gating, CSRF, seeded login).
// No extra deps — node:test + fetch + a spawned `next start`.
//
// Run with:  npm run test:e2e   (after `npm run build`)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const PORT = 3399;
const BASE = `http://localhost:${PORT}`;
let server;

before(async () => {
  server = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    {
      env: {
        ...process.env,
        APP_SECRET: process.env.APP_SECRET || "e2e_test_secret_thirty_two_chars_minimum",
        DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
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

after(() => server?.kill());

const req = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    headers: { Origin: BASE, "Content-Type": "application/json", ...(opts.headers || {}) },
    redirect: "manual",
    ...opts,
  });

test("health endpoint reports DB up", async () => {
  const r = await req("/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
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
  const s = await req("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "E2E", email, password, role: "buyer" }) });
  assert.equal(s.status, 200, "signup returns neutral 200");
  const l = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert.equal(l.status, 403, "unverified login blocked");
  assert.equal((await l.json()).code, "verify_email");
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
