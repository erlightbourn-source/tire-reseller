// Auto-select the Prisma datasource provider from DATABASE_URL at build time, so
// you never hand-edit schema.prisma to deploy. A postgres:// URL → "postgresql",
// anything else (file:./dev.db) → "sqlite". Runs before `prisma generate` in the
// build script; locally this keeps the committed default ("sqlite") untouched.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const url = process.env.DATABASE_URL || "";
const provider = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";

const schemaPath = fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url));
const src = readFileSync(schemaPath, "utf8");
// Only matches the datasource provider (sqlite|postgresql), never the generator.
const next = src.replace(/provider\s*=\s*"(?:sqlite|postgresql)"/, `provider = "${provider}"`);

if (next !== src) {
  writeFileSync(schemaPath, next);
  console.log(`[db-provider] datasource provider set to "${provider}"`);
} else {
  console.log(`[db-provider] datasource provider already "${provider}"`);
}
