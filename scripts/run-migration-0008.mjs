import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "expenses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "expense_number" varchar(30) NOT NULL,
      "date" date NOT NULL,
      "supplier_id" uuid REFERENCES "suppliers"("id") ON DELETE SET NULL,
      "supplier_name" varchar(255),
      "bank_account_id" uuid NOT NULL REFERENCES "bank_accounts"("id"),
      "description" text,
      "subtotal" numeric(18,2) NOT NULL DEFAULT '0',
      "tax_amount" numeric(18,2) NOT NULL DEFAULT '0',
      "total" numeric(18,2) NOT NULL DEFAULT '0',
      "currency" varchar(3) NOT NULL DEFAULT 'AED',
      "reference" varchar(100),
      "journal_entry_id" uuid,
      "document_id" uuid REFERENCES "documents"("id") ON DELETE SET NULL,
      "is_demo" boolean NOT NULL DEFAULT false,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `);
  console.log("OK: expenses table created");

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "expense_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "expense_id" uuid NOT NULL REFERENCES "expenses"("id") ON DELETE CASCADE,
      "description" text NOT NULL DEFAULT '',
      "gl_account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
      "quantity" numeric(18,4) NOT NULL DEFAULT '1',
      "unit_price" numeric(18,2) NOT NULL DEFAULT '0',
      "amount" numeric(18,2) NOT NULL DEFAULT '0',
      "tax_rate" numeric(5,2) DEFAULT '5',
      "tax_amount" numeric(18,2) DEFAULT '0',
      "line_order" integer NOT NULL DEFAULT 0
    )
  `);
  console.log("OK: expense_lines table created");
} catch (e) {
  const msg = e?.message ?? String(e);
  if (msg.includes("already exists")) {
    console.log("SKIP (already exists)");
  } else {
    console.error(e);
    process.exit(1);
  }
}

await sql.end();
console.log("Migration 0008 complete.");
