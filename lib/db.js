import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

// On Cloudflare Workers (the planned host, ledger L612) Prisma's standard engine can't run
// (EvalError: code generation from strings disallowed), so queries go through Neon's HTTP
// driver via the driverAdapters preview. HTTP mode opens no socket that outlives a request
// (Workers forbid cross-request I/O) and the app uses no interactive $transaction.
// Everywhere else (Vercel, local dev, tests) the client is exactly as before.
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function makeClient() {
  const log = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  if (onWorkers) {
    return new PrismaClient({ adapter: new PrismaNeonHTTP(neon(process.env.DATABASE_URL)), log });
  }
  return new PrismaClient({ log });
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
