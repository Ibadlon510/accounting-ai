import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy-init: avoid crashing at build time when DATABASE_URL is not yet set.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Add it to .env.local.");
    }
    // Local and Render-internal URLs don't need SSL; external connections do.
    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    const isInternal = connectionString.includes("@dpg-") || connectionString.includes(".render.com:5432");
    const client = postgres(connectionString, {
      max: 10,
      ...(isLocal || isInternal ? {} : { ssl: "require" }),
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export { getDb };

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
export * from "./schema";
