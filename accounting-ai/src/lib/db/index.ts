import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const PLACEHOLDER_PATTERNS = [
  "[YOUR-PASSWORD]",
  "[YOUR-PA",
  "YOUR-PASSWORD",
  "your-password",
  "<YOUR-PASSWORD>",
];

function isPlaceholderUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

/**
 * Supabase: for serverless (e.g. Next.js API routes) use the Transaction pooler
 * connection string (port 6543) from Dashboard → Connect → Transaction pooler.
 * Direct (5432) uses IPv6 and can fail on some networks; pooler supports IPv4.
 */
function getConnectionConfig(connectionString: string) {
  return {
    max: 10,
    ssl: "require" as const,
    prepare: false, // required for Supabase transaction pooler (PgBouncer)
    connect_timeout: 10,
  };
}

// Lazy-init: avoid crashing at build time when DATABASE_URL is not yet set.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Add it to .env.local (see Supabase Dashboard → Connect).");
    }
    if (isPlaceholderUrl(connectionString)) {
      throw new Error(
        "DATABASE_URL still contains a placeholder (e.g. [YOUR-PASSWORD]). " +
          "Replace it with your real database password from Supabase Dashboard → Project Settings → Database, " +
          "and use the 'Transaction pooler' URI (port 6543) for Next.js/serverless."
      );
    }
    const client = postgres(connectionString, getConnectionConfig(connectionString));
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
export * from "./schema";
