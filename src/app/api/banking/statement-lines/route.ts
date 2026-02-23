import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankStatementLines, bankStatements } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statementId = searchParams.get("statementId");
  const bankAccountId = searchParams.get("bankAccountId");

  if (statementId) {
    const [stmt] = await db
      .select()
      .from(bankStatements)
      .where(and(eq(bankStatements.id, statementId), eq(bankStatements.organizationId, orgId)))
      .limit(1);
    if (!stmt) return NextResponse.json({ error: "Statement not found" }, { status: 404 });

    const lines = await db
      .select()
      .from(bankStatementLines)
      .where(eq(bankStatementLines.bankStatementId, statementId))
      .orderBy(asc(bankStatementLines.lineOrder));

    return NextResponse.json({
      lines: lines.map((l) => ({
        id: l.id,
        bankStatementId: l.bankStatementId,
        transactionDate: l.transactionDate,
        description: l.description,
        amount: parseFloat(l.amount ?? "0"),
        type: l.type,
        reference: l.reference,
        matchedBankTransactionId: l.matchedBankTransactionId,
        reconciledAt: l.reconciledAt,
        lineOrder: l.lineOrder,
      })),
    });
  }

  if (bankAccountId) {
    const lines = await db
      .select({
        id: bankStatementLines.id,
        bankStatementId: bankStatementLines.bankStatementId,
        transactionDate: bankStatementLines.transactionDate,
        description: bankStatementLines.description,
        amount: bankStatementLines.amount,
        type: bankStatementLines.type,
        reference: bankStatementLines.reference,
        matchedBankTransactionId: bankStatementLines.matchedBankTransactionId,
        reconciledAt: bankStatementLines.reconciledAt,
        lineOrder: bankStatementLines.lineOrder,
      })
      .from(bankStatementLines)
      .innerJoin(bankStatements, eq(bankStatementLines.bankStatementId, bankStatements.id))
      .where(
        and(
          eq(bankStatements.organizationId, orgId),
          eq(bankStatements.bankAccountId, bankAccountId)
        )
      )
      .orderBy(asc(bankStatementLines.lineOrder));

    const mapped = lines.map((l) => ({
      id: l.id,
      bankStatementId: l.bankStatementId,
      transactionDate: l.transactionDate,
      description: l.description,
      amount: parseFloat(l.amount ?? "0"),
      type: l.type,
      reference: l.reference,
      matchedBankTransactionId: l.matchedBankTransactionId,
      reconciledAt: l.reconciledAt,
      lineOrder: l.lineOrder,
    }));

    mapped.sort((a, b) => (b.transactionDate ?? "").localeCompare(a.transactionDate ?? ""));

    return NextResponse.json({ lines: mapped });
  }

  return NextResponse.json({ error: "statementId or bankAccountId required" }, { status: 400 });
}
