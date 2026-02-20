import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import postgres from "postgres";

const PLACEHOLDER_PATTERNS = ["[YOUR-PASSWORD]", "[YOUR-PA", "YOUR-PASSWORD", "your-password"];

function isPlaceholderUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

function serializeError(e: unknown, depth = 0): Record<string, unknown> {
  if (depth > 3) return { message: "[max depth]" };
  const err = e as Error & { code?: string; detail?: string; hint?: string; cause?: unknown; severity?: string; errno?: string };
  const obj: Record<string, unknown> = {
    message: err?.message ?? String(e),
    code: err?.code,
    detail: err?.detail,
    hint: err?.hint,
    severity: err?.severity,
    errno: err?.errno,
    name: err?.name,
  };
  if (err?.cause) {
    obj.cause = serializeError(err.cause, depth + 1);
  }
  // Strip undefined keys
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/**
 * GET /api/debug/db — temporary endpoint to diagnose database connectivity.
 * Remove after debugging.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
  };

  const url = process.env.DATABASE_URL ?? "";
  if (url && isPlaceholderUrl(url)) {
    checks.connection = "FAILED";
    checks.connection_error = {
      message: "DATABASE_URL contains a placeholder (e.g. [YOUR-PASSWORD]). Replace with your real password.",
      fix: "Supabase Dashboard → Project Settings → Database → Connection string. Use 'Transaction pooler' (port 6543) for Next.js.",
    };
    return NextResponse.json(checks, { status: 400 });
  }

  // 0. Raw postgres.js test (bypass drizzle)
  try {
    const raw = postgres(url, { ssl: "require", prepare: false, connect_timeout: 10, max: 1 });
    const rawResult = await raw`SELECT 1 as ok`;
    checks.raw_connection = "OK";
    checks.raw_result = rawResult;
    await raw.end();
  } catch (e: unknown) {
    checks.raw_connection = "FAILED";
    checks.raw_error = serializeError(e);
  }

  // 1. Basic connection test (via drizzle)
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.connection = "OK";
    checks.connection_result = result;
  } catch (e: unknown) {
    checks.connection = "FAILED";
    checks.connection_error = serializeError(e);
    checks.connection_fix_hint =
      "For Next.js/serverless use the Transaction pooler: Supabase Dashboard → Connect → Transaction pooler (port 6543). Ensure DATABASE_URL has no placeholder and SSL works (direct 5432 requires IPv6).";
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
