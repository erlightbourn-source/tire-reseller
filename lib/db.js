import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, types as pgTypes } from "@neondatabase/serverless";

// On Cloudflare Workers (the planned host, ledger L612) Prisma's standard engine can't run
// (EvalError: code generation from strings disallowed), so queries go through Neon's HTTP
// driver via the driverAdapters preview. HTTP mode opens no socket that outlives a request
// (Workers forbid cross-request I/O) and the app uses no interactive $transaction.
// Everywhere else (Vercel, local dev, tests) the client is exactly as before.
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

// PrismaNeonHTTP (5.22) passes no type parsers, so the driver turns timestamps into JS Date
// objects and Prisma fails with "expected a string in column 'createdAt', found {}". Keep the
// raw text, as the adapter's own Pool mode does (its customParsers, 2026-09-29 L612 fix).
const keepText = (v) => v;
const stripTz = (v) => v.split("+")[0];
const TEXT_PARSERS = {
  1082: keepText, // date
  1083: keepText, // time
  1114: keepText, // timestamp (Prisma DateTime default)
  1184: stripTz, //  timestamptz
  1266: stripTz, //  timetz
  114: keepText, //  json
  3802: keepText, // jsonb
};
const httpTypes = {
  getTypeParser: (oid, format) =>
    (format === undefined || format === "text") && TEXT_PARSERS[oid]
      ? TEXT_PARSERS[oid]
      : pgTypes.getTypeParser(oid, format),
};

function makeClient() {
  const log = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  if (onWorkers) {
    // neon()'s own `types` default is dropped once the adapter passes per-call options,
    // so inject it on every call (the adapter only ever calls client(sql, values, opts)).
    const base = neon(process.env.DATABASE_URL);
    const sql = (text, values, opts) => base(text, values, { ...opts, types: httpTypes });
    return new PrismaClient({ adapter: new PrismaNeonHTTP(sql), log });
  }
  return new PrismaClient({ log });
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
