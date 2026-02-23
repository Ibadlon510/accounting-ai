import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankStatements, bankStatementLines } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";


export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bankAccountId = searchParams.get("bankAccountId");

  if (!bankAccountId) {
    return NextResponse.json({ error: "bankAccountId required" }, { status: 400 });
  }

  try {
    const stmtsWithCounts = await db
      .select({
        id: bankStatements.id,
        bankAccountId: bankStatements.bankAccountId,
        uploadedAt: bankStatements.uploadedAt,
        fileName: bankStatements.fileName,
        status: bankStatements.status,
        lineCount: sql<number>`count(${bankStatementLines.id})::int`,
        reconciledCount: sql<number>`count(*) filter (where ${bankStatementLines.reconciledAt} is not null)::int`,
      })
      .from(bankStatements)
      .leftJoin(bankStatementLines, eq(bankStatementLines.bankStatementId, bankStatements.id))
      .where(and(eq(bankStatements.organizationId, orgId), eq(bankStatements.bankAccountId, bankAccountId)))
      .groupBy(bankStatements.id, bankStatements.bankAccountId, bankStatements.uploadedAt, bankStatements.fileName, bankStatements.status)
      .orderBy(desc(bankStatements.uploadedAt));

    const result = stmtsWithCounts.map((s) => ({
      id: s.id,
      bankAccountId: s.bankAccountId,
      uploadedAt: s.uploadedAt,
      fileName: s.fileName,
      status: s.status,
      lineCount: Number(s.lineCount ?? 0),
      reconciledCount: Number(s.reconciledCount ?? 0),
    }));

    return NextResponse.json({ statements: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load statements";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
