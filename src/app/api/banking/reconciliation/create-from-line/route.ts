import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankStatementLines, bankStatements, bankTransactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createOwnerDepositReceipt, createOwnerWithdrawalPayment } from "@/lib/banking/services";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { statementLineId: string; entryType: "receipt" | "payment"; autoLink?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { statementLineId, entryType, autoLink = true } = body;
  if (!statementLineId || !entryType || !["receipt", "payment"].includes(entryType)) {
    return NextResponse.json({ error: "Missing or invalid statementLineId, entryType (receipt|payment)" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [line] = await tx
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

      if (!line) return { error: "Statement line not found", status: 404 as const };

      const [stmt] = await tx.select({ bankAccountId: bankStatements.bankAccountId }).from(bankStatements).where(eq(bankStatements.id, line.bankStatementId)).limit(1);
      const bankAccountId = stmt?.bankAccountId;
      if (!bankAccountId) return { error: "Statement has no bank account", status: 400 as const };

      const amount = parseFloat(line.amount ?? "0");
      const date = line.transactionDate ?? new Date().toISOString().slice(0, 10);
      const description = line.description ?? "From statement";
      const reference = `Stmt line ${statementLineId.slice(0, 8)}`;

      if (entryType === "receipt" && line.type !== "credit") {
        return { error: "Receipt can only be created from a credit line", status: 400 as const };
      }
      if (entryType === "payment" && line.type !== "debit") {
        return { error: "Payment can only be created from a debit line", status: 400 as const };
      }

      let bankTransactionId: string | null;
      if (entryType === "receipt") {
        const { bankTransactionId: btId } = await createOwnerDepositReceipt(
          orgId,
          { date, bankAccountId, amount, description, reference },
          tx
        );
        bankTransactionId = btId;
      } else {
        const { bankTransactionId: btId } = await createOwnerWithdrawalPayment(
          orgId,
          { date, bankAccountId, amount, description, reference },
          tx
        );
        bankTransactionId = btId;
      }

      if (autoLink && bankTransactionId) {
        await tx
          .update(bankStatementLines)
          .set({ matchedBankTransactionId: bankTransactionId, reconciledAt: new Date() })
          .where(eq(bankStatementLines.id, statementLineId));
        await tx.update(bankTransactions).set({ isReconciled: true }).where(eq(bankTransactions.id, bankTransactionId));
      }

      return { ok: true as const, bankTransactionId, paymentId: undefined };
    });

    if ("error" in result && "status" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, bankTransactionId: result.bankTransactionId, paymentId: result.paymentId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create from line";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
