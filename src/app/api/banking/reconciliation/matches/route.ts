import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankStatementLines, bankTransactions, bankStatements } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statementLineId = searchParams.get("statementLineId");
  if (!statementLineId) return NextResponse.json({ error: "statementLineId required" }, { status: 400 });

  try {
    const [line] = await db
      .select({
        id: bankStatementLines.id,
        bankStatementId: bankStatementLines.bankStatementId,
        transactionDate: bankStatementLines.transactionDate,
        description: bankStatementLines.description,
        amount: bankStatementLines.amount,
        type: bankStatementLines.type,
      })
      .from(bankStatementLines)
      .innerJoin(bankStatements, eq(bankStatementLines.bankStatementId, bankStatements.id))
      .where(and(eq(bankStatementLines.id, statementLineId), eq(bankStatements.organizationId, orgId)))
      .limit(1);

    if (!line) return NextResponse.json({ error: "Statement line not found" }, { status: 404 });

    const [stmt] = await db.select({ bankAccountId: bankStatements.bankAccountId }).from(bankStatements).where(eq(bankStatements.id, line.bankStatementId)).limit(1);
    const bankAccountId = stmt?.bankAccountId;
    if (!bankAccountId) return NextResponse.json({ error: "Statement has no bank account" }, { status: 400 });

    const lineAmount = parseFloat(line.amount ?? "0");
    const lineDate = line.transactionDate ?? "";
    const lineDesc = (line.description ?? "").toLowerCase();

    const amountLow = (lineAmount * 0.9).toFixed(2);
    const amountHigh = (lineAmount * 1.1).toFixed(2);
    const dateLow = new Date(new Date(lineDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateHigh = new Date(new Date(lineDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const candidates = await db
      .select({
        id: bankTransactions.id,
        transactionDate: bankTransactions.transactionDate,
        description: bankTransactions.description,
        amount: bankTransactions.amount,
        type: bankTransactions.type,
        category: bankTransactions.category,
        transferReference: bankTransactions.transferReference,
      })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, orgId),
          eq(bankTransactions.bankAccountId, bankAccountId),
          eq(bankTransactions.type, line.type),
          sql`${bankTransactions.isReconciled} = false`,
          sql`${bankTransactions.amount}::numeric between ${amountLow}::numeric and ${amountHigh}::numeric`,
          sql`${bankTransactions.transactionDate}::date between ${dateLow}::date and ${dateHigh}::date`
        )
      );

    const scored = candidates.map((c) => {
      const cAmount = parseFloat(c.amount ?? "0");
      const cDate = c.transactionDate ?? "";
      const cDesc = (c.description ?? "").toLowerCase();

      let score = 0;
      if (Math.abs(cAmount - lineAmount) < 0.01) score += 50;
      else if (Math.abs(cAmount - lineAmount) < 1) score += 30;
      else if (Math.abs(cAmount - lineAmount) < 10) score += 10;

      const dateDiff = Math.abs(new Date(cDate).getTime() - new Date(lineDate).getTime()) / (1000 * 60 * 60 * 24);
      if (dateDiff <= 0) score += 30;
      else if (dateDiff <= 3) score += 20;
      else if (dateDiff <= 7) score += 10;

      const descMatch = lineDesc && cDesc && (cDesc.includes(lineDesc.slice(0, 20)) || lineDesc.includes(cDesc.slice(0, 20)));
      if (descMatch) score += 20;

      return { ...c, amount: cAmount, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const matches = scored.slice(0, 20).map((m) => ({
      id: m.id,
      transactionDate: m.transactionDate,
      description: m.description,
      amount: m.amount,
      type: m.type,
      category: m.category,
      transferReference: m.transferReference,
      score: m.score,
    }));

    return NextResponse.json({ matches });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to get matches";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
