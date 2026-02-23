import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

const migration = readFileSync(
  join(__dirname, "../drizzle/0004_add_banking_columns_and_tables.sql"),
  "utf-8"
);

const statements = migration
  .split(/-->\s*statement-breakpoint\s*/)
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  if (!stmt) continue;
  try {
    await sql.unsafe(stmt);
    console.log("OK:", stmt.slice(0, 60) + "...");
  } catch (e) {
    const msg = e?.message ?? String(e);
    if (msg.includes("already exists") || msg.includes("duplicate key")) {
      console.log("SKIP (already exists):", stmt.slice(0, 50) + "...");
    } else {
      throw e;
    }
  }
}
await sql.end();
console.log("Migration 0004 complete.");
