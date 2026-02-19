import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * GET /api/debug/db — temporary endpoint to diagnose database connectivity.
 * Remove after debugging.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
  };

  // 1. Basic connection test
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.connection = "OK";
    checks.connection_result = result;
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    checks.connection = "FAILED";
    checks.connection_error = {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
    };
    return NextResponse.json(checks, { status: 500 });
  }

  // 2. Check if users table exists
  try {
    const result = await db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as exists`
    );
    checks.users_table_exists = result;
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    checks.users_table_check = "FAILED";
    checks.users_table_error = { message: err?.message, code: err?.code };
  }

  // 3. Try the actual query (SELECT from users)
  try {
    const result = await db.select().from(users).limit(1);
    checks.users_query = "OK";
    checks.users_query_count = result.length;
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    checks.users_query = "FAILED";
    checks.users_query_error = {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint,
    };
  }

  // 4. List public tables
  try {
    const result = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    checks.public_tables = result;
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    checks.public_tables_error = { message: err?.message };
  }

  return NextResponse.json(checks);
}
