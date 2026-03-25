import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — cannot run migrations.");
  process.exit(1);
}

const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const isRenderInternal = url.includes("@dpg-") && !url.includes(".render.com");
const needsSsl = !isLocal && !isRenderInternal;

const connection = postgres(url, {
  max: 1,
  ...(needsSsl ? { ssl: "require" } : {}),
});
const db = drizzle(connection);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await connection.end();
}
