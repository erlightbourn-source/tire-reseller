// Smoke test for BACKLOG #2.5's remaining sub-item: lib/auth.js refuses to
// boot on a deployed environment with a missing/weak APP_SECRET (see the
// `IS_DEPLOYED` guard), but that guard only throws when a route module that
// imports lib/auth.js is first evaluated — NOT at `next start` boot time,
// and NOT on /api/health (which only touches lib/db). That means a
// misconfigured deploy can look "healthy" to a monitor while every
// auth-touching route silently 500s. This locks in that current behavior as
// a known, tested gap rather than an assumption — see the safety report for
// the launch-readiness recommendation (fail closed at boot, not per-route).
//
// Run with: npm run test:e2e (after `npm run build`) — deliberately excluded
// from the default `node --test` unit-test glob (needs a real build + spawns
// two full `next start` processes), same reasoning as e2e/flows.mjs.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const PORT = 3398; // distinct from e2e/flows.mjs's 3399 so both can run back-to-back
const BASE = `http://localhost:${PORT}`;
const DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";

function bootServer(appSecretEnv) {
  return spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    env: { ...process.env, ...appSecretEnv, DATABASE_URL, NODE_ENV: "production" },
    stdio: "ignore",
  });
}

async function waitForHealth(deadlineMs = 60_000) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return r;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("app-secret-boot: server did not become ready");
}

test("weak APP_SECRET: boots + /api/health stays green, but an auth-touching route 500s", async () => {
  const server = bootServer({ APP_SECRET: "too_short" }); // < 32 chars
  try {
    const health = await waitForHealth();
    assert.equal(health.status, 200, "health check does not exercise lib/auth — this is the gap");

    const account = await fetch(`${BASE}/api/account`);
    assert.equal(
      account.status,
      500,
      "an auth-touching route must fail once lib/auth.js's IS_DEPLOYED guard evaluates"
    );
  } finally {
    server.kill();
  }
});

test("control: a valid 32+ char APP_SECRET boots the same route normally (401, not 500)", async () => {
  const server = bootServer({ APP_SECRET: "e2e_boot_control_secret_32chars_min" });
  try {
    await waitForHealth();
    const account = await fetch(`${BASE}/api/account`);
    assert.equal(account.status, 401, "unauthenticated request to a working auth path is a normal 401");
  } finally {
    server.kill();
  }
});
