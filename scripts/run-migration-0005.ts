import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  onnotice: () => {},
});

async function run() {
  try {
    await sql.unsafe(`
      ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "account_type" varchar(20) NOT NULL DEFAULT 'bank'
    `);
    console.log("Migration 0005 complete: account_type column added to bank_accounts.");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
