import { config } from "dotenv";
config({ path: ".env.local" });
config();

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  onnotice: () => {},
});

const statements = [
  'ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "bank_transactions" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "bank_statements" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
  'ALTER TABLE "vat_returns" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false',
];

async function run() {
  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log("OK:", stmt.slice(0, 60) + "...");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log("SKIP (already exists):", stmt.slice(0, 50) + "...");
      } else {
        throw e;
      }
    }
  }
  await sql.end();
  console.log("Migration 0006 complete: is_demo columns added.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
