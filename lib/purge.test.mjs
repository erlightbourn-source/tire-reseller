// Verify-by-observation test for purgeStaleUsers (lib/purge.js) — the unverified-
// signup cleanup + the pre-existing soft-delete purge, in one pass.
//
// No DB spin-up: a mock Prisma seeds a dataset and evaluates the EXACT clause
// shapes the purge builds (deletedAt.lt, emailVerified eq + createdAt.lt, OR), so
// the selection correctness (the real risk) is checked directly, and the cascade +
// rating-recompute orchestration is driven end-to-end. Run: node --test lib/purge.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { purgeStaleUsers } from "./purge.js";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 31, 12, 0, 0); // fixed clock

// --- minimal Prisma-where matcher (only the operators purge.js uses) ----------
function matchClause(u, clause) {
  return Object.entries(clause).every(([k, v]) => {
    if (v && typeof v === "object" && "lt" in v) {
      return u[k] != null && new Date(u[k]).getTime() < new Date(v.lt).getTime();
    }
    return u[k] === v;
  });
}
function matchUser(u, where) {
  if (where.OR) return where.OR.some((c) => matchClause(u, c));
  return matchClause(u, where);
}

function mockPrisma(users, reviews) {
  const calls = { deleteMany: [], update: [] };
  return {
    calls,
    users,
    reviews,
    user: {
      findMany: async ({ where, take }) =>
        users.filter((u) => matchUser(u, where)).slice(0, take).map((u) => ({ id: u.id })),
      deleteMany: async ({ where }) => {
        const ids = new Set(where.id.in);
        calls.deleteMany.push([...ids]);
        // simulate onDelete: Cascade — drop the users and any reviews they touch
        for (let i = users.length - 1; i >= 0; i--) if (ids.has(users[i].id)) users.splice(i, 1);
        for (let i = reviews.length - 1; i >= 0; i--)
          if (ids.has(reviews[i].authorId) || ids.has(reviews[i].sellerId)) reviews.splice(i, 1);
        return { count: ids.size };
      },
      update: async ({ where, data }) => { calls.update.push({ id: where.id, data }); return {}; },
    },
    review: {
      findMany: async ({ where }) => {
        const inIds = new Set(where.authorId.in);
        const seen = new Set();
        const out = [];
        for (const r of reviews) if (inIds.has(r.authorId) && !seen.has(r.sellerId)) {
          seen.add(r.sellerId); out.push({ sellerId: r.sellerId });
        }
        return out;
      },
      aggregate: async ({ where }) => {
        const rs = reviews.filter((r) => r.sellerId === where.sellerId);
        const avg = rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : null;
        return { _avg: { rating: avg }, _count: { _all: rs.length } };
      },
    },
  };
}

test("purges stale soft-deleted AND abandoned unverified; keeps fresh/verified; recomputes ratings", async () => {
  const users = [
    { id: "u1", deletedAt: new Date(NOW - 8 * DAY), emailVerified: true, createdAt: new Date(NOW - 40 * DAY) },   // soft-del stale -> PURGE
    { id: "u2", deletedAt: new Date(NOW - 2 * DAY), emailVerified: true, createdAt: new Date(NOW - 40 * DAY) },   // soft-del fresh -> keep
    { id: "u3", deletedAt: null, emailVerified: false, createdAt: new Date(NOW - 8 * DAY) },                       // unverified stale -> PURGE
    { id: "u4", deletedAt: null, emailVerified: false, createdAt: new Date(NOW - 1 * DAY) },                       // unverified fresh -> keep
    { id: "u5", deletedAt: null, emailVerified: true, createdAt: new Date(NOW - 100 * DAY) },                      // verified seller -> keep (rating recomputed)
    { id: "u6", deletedAt: new Date(NOW - 9 * DAY), emailVerified: true, createdAt: new Date(NOW - 60 * DAY) },    // soft-del stale author -> PURGE
    { id: "u7", deletedAt: null, emailVerified: true, createdAt: new Date(NOW - 30 * DAY) },                       // verified reviewer -> keep
  ];
  const reviews = [
    { authorId: "u6", sellerId: "u5", rating: 4 }, // will be cascade-removed with u6
    { authorId: "u7", sellerId: "u5", rating: 2 }, // survives -> new avg for u5
  ];
  const db = mockPrisma(users, reviews);

  const res = await purgeStaleUsers(db, NOW);

  const purged = db.calls.deleteMany.flat().sort();
  assert.deepEqual(purged, ["u1", "u3", "u6"], "exactly the stale soft-deleted + stale unverified rows");
  assert.equal(res.purged, 3);
  assert.ok(!db.users.find((u) => ["u1", "u3", "u6"].includes(u.id)), "purged rows gone");
  assert.ok(["u2", "u4", "u5", "u7"].every((id) => db.users.find((u) => u.id === id)), "fresh/verified kept");

  // u5's rating recomputed to only the surviving review (u7's rating 2)
  const upd = db.calls.update.find((c) => c.id === "u5");
  assert.ok(upd, "u5 rating recomputed");
  assert.equal(upd.data.ratingAvg, 2);
  assert.equal(upd.data.ratingCount, 1);
  assert.equal(res.ratingsRecomputed, 1);
});

test("empty result short-circuits (no delete, no recompute)", async () => {
  const users = [
    { id: "a", deletedAt: null, emailVerified: true, createdAt: new Date(NOW - 100 * DAY) },
    { id: "b", deletedAt: null, emailVerified: false, createdAt: new Date(NOW - 1 * DAY) }, // fresh unverified
  ];
  const db = mockPrisma(users, []);
  const res = await purgeStaleUsers(db, NOW);
  assert.deepEqual(res, { ok: true, purged: 0, ratingsRecomputed: 0 });
  assert.equal(db.calls.deleteMany.length, 0);
});

test("respects the 500-row batch cap", async () => {
  const users = Array.from({ length: 700 }, (_, i) => ({
    id: `x${i}`, deletedAt: null, emailVerified: false, createdAt: new Date(NOW - 30 * DAY),
  }));
  const db = mockPrisma(users, []);
  const res = await purgeStaleUsers(db, NOW);
  assert.equal(res.purged, 500, "capped at 500 per run; remainder drains next run");
});
