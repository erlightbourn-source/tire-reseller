import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// On Cloudflare Workers (ledger L612) Prisma's standard engine can't run (EvalError: code
// generation from strings disallowed), so queries go through Neon's serverless driver via the
// driverAdapters preview. It has to be the WebSocket Pool, not Neon's HTTP mode: Prisma 5.22
// wraps plain writes such as updateMany in an implicit transaction, and HTTP mode has none
// (email verify 500'd on the preview Worker, 2026-09-29). Workers forbid reusing a socket
// across requests, so each request gets its own Pool + client, keyed on OpenNext's
// per-request context object and closed once the request is done.
// Everywhere else (Vercel, local dev, tests) the client is exactly as before.
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
const log = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

const perRequest = new WeakMap();

// Resolves once every connection has idled out, so the sockets close cleanly instead of being
// torn down with the request. Never ends the pool: a later query in the same request (e.g.
// after a slow Stripe call) simply reconnects.
async function drained(pool) {
  const deadline = Date.now() + 25_000;
  do {
    await new Promise((r) => setTimeout(r, 250));
  } while (pool.totalCount > 0 && Date.now() < deadline);
}

function requestClient() {
  const context = getCloudflareContext();
  let client = perRequest.get(context);
  if (!client) {
    // Idle connections close themselves after 2s; waitUntil (capped at 25s) keeps the
    // invocation alive until they have.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, idleTimeoutMillis: 2_000 });
    // An idle socket dropped at request teardown emits 'error' on the pool; without a listener
    // that surfaces as an unhandled "Network connection lost". Queries still reject normally.
    pool.on("error", () => {});
    client = new PrismaClient({ adapter: new PrismaNeon(pool), log });
    perRequest.set(context, client);
    context.ctx?.waitUntil?.(drained(pool));
  }
  return client;
}

function makeClient() {
  if (onWorkers) {
    return new Proxy(
      {},
      {
        get(_target, prop) {
          const client = requestClient();
          const value = client[prop];
          return typeof value === "function" ? value.bind(client) : value;
        },
      }
    );
  }
  return new PrismaClient({ log });
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
