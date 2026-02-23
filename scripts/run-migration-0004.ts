import "dotenv/config";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  onnotice: () => {},
});

const migration = readFileSync(
  join(__dirname, "../drizzle/0004_add_banking_columns_and_tables.sql"),
  "utf-8"
);

const statements = migration
  .split(/-->\s*statement-breakpoint\s*/)
  .map((s) => s.trim())
  .filter(Boolean);

async function run() {
  for (const stmt of statements) {
    if (!stmt) continue;
    try {
      await sql.unsafe(stmt);
      console.log("OK:", stmt.slice(0, 60) + "...");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists") || msg.includes("duplicate key")) {
        console.log("SKIP (already exists):", stmt.slice(0, 50) + "...");
      } else {
        throw e;
      }
    }
  }
  await sql.end();
  console.log("Migration 0004 complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
