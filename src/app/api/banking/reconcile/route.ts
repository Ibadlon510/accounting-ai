import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankTransactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { transactionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { transactionId } = body;
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
  }

  try {
    const [txn] = await db
      .select({ id: bankTransactions.id, isReconciled: bankTransactions.isReconciled })
      .from(bankTransactions)
      .where(and(eq(bankTransactions.id, transactionId), eq(bankTransactions.organizationId, orgId)))
      .limit(1);

    if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (txn.isReconciled) return NextResponse.json({ error: "Already reconciled" }, { status: 409 });

    await db
      .update(bankTransactions)
      .set({ isReconciled: true })
      .where(eq(bankTransactions.id, transactionId));

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to reconcile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
