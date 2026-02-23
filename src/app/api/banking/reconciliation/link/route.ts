import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankStatementLines, bankTransactions, bankStatements } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { statementLineId: string; bankTransactionId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { statementLineId, bankTransactionId } = body;
  if (!statementLineId || !bankTransactionId) {
    return NextResponse.json({ error: "Missing statementLineId or bankTransactionId" }, { status: 400 });
  }

  try {
    const lines = await db
      .select({ lineId: bankStatementLines.id })
      .from(bankStatementLines)
      .innerJoin(bankStatements, eq(bankStatementLines.bankStatementId, bankStatements.id))
      .where(and(eq(bankStatementLines.id, statementLineId), eq(bankStatements.organizationId, orgId)))
      .limit(1);

    if (!lines[0]) return NextResponse.json({ error: "Statement line not found" }, { status: 404 });

    const txns = await db.select().from(bankTransactions).where(and(eq(bankTransactions.id, bankTransactionId), eq(bankTransactions.organizationId, orgId))).limit(1);
    if (!txns[0]) return NextResponse.json({ error: "Bank transaction not found" }, { status: 404 });

    await db.update(bankStatementLines).set({ matchedBankTransactionId: bankTransactionId, reconciledAt: new Date() }).where(eq(bankStatementLines.id, statementLineId));
    await db.update(bankTransactions).set({ isReconciled: true }).where(eq(bankTransactions.id, bankTransactionId));

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
