import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  bankTransactions,
  bankAccounts,
  chartOfAccounts,
  journalEntries,
  journalLines,
  payments,
  paymentAllocations,
  invoices,
  bills,
  customers,
  suppliers,
  organizations,
  contactCredits,
} from "@/lib/db/schema";
import { eq, and, count, desc, inArray } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";
import { createOwnerDepositReceipt } from "@/lib/banking/services";
import { sendDocumentEmail } from "@/lib/email/document-email";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bankAccountId = searchParams.get("bankAccountId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10) || 25));
  const offset = (page - 1) * limit;

  try {
    const whereClause = bankAccountId
      ? and(eq(bankTransactions.organizationId, orgId), eq(bankTransactions.type, "credit"), eq(bankTransactions.bankAccountId, bankAccountId))
      : and(eq(bankTransactions.organizationId, orgId), eq(bankTransactions.type, "credit"));

    const [totalRow] = await db.select({ c: count() }).from(bankTransactions).where(whereClause);
    const total = Number(totalRow?.c ?? 0);

    const rows = await db
      .select({
        id: bankTransactions.id,
        bankAccountId: bankTransactions.bankAccountId,
        transactionDate: bankTransactions.transactionDate,
        description: bankTransactions.description,
        amount: bankTransactions.amount,
        type: bankTransactions.type,
        reference: bankTransactions.reference,
        category: bankTransactions.category,
        isReconciled: bankTransactions.isReconciled,
        transferReference: bankTransactions.transferReference,
        paymentId: bankTransactions.paymentId,
      })
      .from(bankTransactions)
      .where(whereClause)
      .orderBy(desc(bankTransactions.transactionDate))
      .limit(limit)
      .offset(offset);

    const accountMap = new Map<string, { accountName: string; currency: string }>();
    const accts = await db.select({ id: bankAccounts.id, accountName: bankAccounts.accountName, currency: bankAccounts.currency }).from(bankAccounts).where(eq(bankAccounts.organizationId, orgId));
    accts.forEach((a) => accountMap.set(a.id, { accountName: a.accountName, currency: a.currency }));

    const entityMap = new Map<string, string>();
    const paymentIds = [...new Set(rows.map((r) => r.paymentId).filter(Boolean))] as string[];
    if (paymentIds.length > 0) {
      const payRows = await db.select({ id: payments.id, entityType: payments.entityType, entityId: payments.entityId }).from(payments).where(and(eq(payments.organizationId, orgId), inArray(payments.id, paymentIds)));
      const custIds = [...new Set(payRows.filter((p) => p.entityType === "customer").map((p) => p.entityId).filter(Boolean))] as string[];
      const suppIds = [...new Set(payRows.filter((p) => p.entityType === "supplier").map((p) => p.entityId).filter(Boolean))] as string[];
      const custMap = new Map((custIds.length ? await db.select({ id: customers.id, name: customers.name }).from(customers).where(and(eq(customers.organizationId, orgId), inArray(customers.id, custIds))) : []).map((c) => [c.id, c.name]));
      const suppMap = new Map((suppIds.length ? await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(and(eq(suppliers.organizationId, orgId), inArray(suppliers.id, suppIds))) : []).map((s) => [s.id, s.name]));
      for (const p of payRows) {
        if (p.entityType === "customer" && p.entityId) entityMap.set(p.id, custMap.get(p.entityId) ?? "—");
        if (p.entityType === "supplier" && p.entityId) entityMap.set(p.id, suppMap.get(p.entityId) ?? "—");
      }
    }

    return NextResponse.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      receipts: rows.map((r) => {
        let entityName = "—";
        if (r.transferReference) {
          const m = r.description?.match(/Transfer from (.+)/i);
          entityName = m ? `From ${m[1].trim()} account` : "Inter-account";
        } else if (r.paymentId) {
          entityName = entityMap.get(r.paymentId) ?? "—";
        }
        return {
          id: r.id,
          bankAccountId: r.bankAccountId,
          accountName: accountMap.get(r.bankAccountId ?? "")?.accountName ?? "",
          currency: accountMap.get(r.bankAccountId ?? "")?.currency ?? "AED",
          transactionDate: r.transactionDate,
          description: r.description,
          amount: parseFloat(r.amount ?? "0"),
          type: r.type,
          reference: r.reference,
          category: r.category,
          isReconciled: r.isReconciled,
          isInterAccountTransfer: !!r.transferReference,
          entityName,
        };
      }),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load receipts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type ReceiptBody = {
  receiptType: "customer_payment" | "owner_deposit" | "refund_received";
  date: string;
  bankAccountId: string;
  amount: number;
  description?: string;
  reference?: string;
  customerId?: string;
  allocations?: ({ invoiceId: string; amount: number } | { billId: string; amount: number })[];
  supplierId?: string;
  unappliedAmount?: number;
};

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ReceiptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { receiptType, date, bankAccountId, amount, description, reference } = body;
  if (!date || !bankAccountId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid: date, bankAccountId, amount" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [ba] = await tx.select({ ledgerAccountId: bankAccounts.ledgerAccountId }).from(bankAccounts).where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId))).limit(1);
      let cashAccountId = ba?.ledgerAccountId ?? null;
      if (!cashAccountId) {
        const [cashAcct] = await tx.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010"))).limit(1);
        cashAccountId = cashAcct?.id ?? null;
      }
      if (!cashAccountId) {
        throw new Error("Chart of accounts missing cash (1010) or bank ledger");
      }

      if (receiptType === "customer_payment") {
      const { customerId, allocations, unappliedAmount: rawUnapplied } = body;
      const unapplied = rawUnapplied ?? 0;
      const invoiceAllocs = allocations?.filter((a): a is { invoiceId: string; amount: number } => "invoiceId" in a && !!a.invoiceId) ?? [];
      if (!customerId || (!invoiceAllocs.length && unapplied <= 0)) throw new Error("customer_payment requires customerId and allocations (or unappliedAmount)");
      const allocSum = invoiceAllocs.reduce((s, a) => s + (a.amount ?? 0), 0);
      if (Math.abs(allocSum + unapplied - amount) > 0.01) throw new Error("Sum of allocations + unappliedAmount must equal amount");

      for (const a of invoiceAllocs) {
        const [inv] = await tx.select({ status: invoices.status, amountDue: invoices.amountDue }).from(invoices).where(and(eq(invoices.id, a.invoiceId), eq(invoices.organizationId, orgId))).limit(1);
        if (inv?.status === "draft") throw new Error("Cannot record receipt against draft invoice. Confirm the invoice first.");
        const invDue = parseFloat(inv?.amountDue ?? "0");
        if (a.amount > invDue + 0.01) throw new Error(`Allocation (${a.amount}) exceeds invoice amount due (${invDue})`);
      }

      const [arAccount] = await tx.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1210"))).limit(1);
      if (!arAccount) throw new Error("Chart of accounts missing AR (1210)");

      const [payCount] = await tx.select({ c: count() }).from(payments).where(eq(payments.organizationId, orgId));
      const payNum = (Number(payCount?.c ?? 0) + 1).toString().padStart(4, "0");
      const ym = date.slice(0, 7).replace("-", "");
      const paymentNumber = `PAY-R-${ym}-${payNum}`;

      const [payment] = await tx
        .insert(payments)
        .values({
          organizationId: orgId,
          paymentNumber,
          paymentDate: date,
          paymentType: "received",
          entityType: "customer",
          entityId: customerId,
          bankAccountId,
          amount: String(amount),
          currency: "AED",
          method: "bank_transfer",
          reference: reference ?? null,
        })
        .returning();

      if (!payment) throw new Error("Failed to create payment");

      for (const a of invoiceAllocs) {
        await tx.insert(paymentAllocations).values({
          paymentId: payment.id,
          documentType: "invoice",
          documentId: a.invoiceId,
          amount: String(a.amount),
        });
        const [inv] = await tx.select({ amountPaid: invoices.amountPaid, total: invoices.total, creditApplied: invoices.creditApplied }).from(invoices).where(and(eq(invoices.id, a.invoiceId), eq(invoices.organizationId, orgId))).limit(1);
        if (inv) {
          const paid = parseFloat(inv.amountPaid ?? "0") + a.amount;
          const total = parseFloat(inv.total ?? "0");
          const credited = parseFloat(inv.creditApplied ?? "0");
          const due = Math.max(0, total - paid - credited);
          await tx.update(invoices).set({ amountPaid: String(paid), amountDue: String(due), status: due <= 0.01 ? "paid" : "partial" }).where(eq(invoices.id, a.invoiceId));
        }
      }

      const [bt] = await tx
        .insert(bankTransactions)
        .values({
          organizationId: orgId,
          bankAccountId,
          transactionDate: date,
          description: description ?? "Customer payment",
          amount: String(amount),
          type: "credit",
          reference: reference ?? paymentNumber,
          category: "customer_payment",
          paymentId: payment.id,
        })
        .returning();

      if (unapplied > 0) {
        await tx.insert(contactCredits).values({
          organizationId: orgId,
          contactType: "customer",
          contactId: customerId,
          sourceType: "overpayment",
          sourceId: payment.id,
          originalAmount: String(unapplied),
          remainingAmount: String(unapplied),
          currency: "AED",
          description: `Overpayment on receipt ${paymentNumber}`,
          creditDate: date,
        });
      }

      const allocatedPortion = allocSum;
      const periodId = await resolveOrCreatePeriod(orgId, date, tx);
      if (periodId) {
        const [entryCountRow] = await tx.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
        const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
        const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
        const [je] = await tx
          .insert(journalEntries)
          .values({
            organizationId: orgId,
            periodId,
            entryNumber,
            entryDate: date,
            description: "Payment received — Receipt",
            reference: payment.id,
            sourceType: "payment",
            sourceId: payment.id,
            status: "posted",
            currency: "AED",
            totalDebit: String(amount),
            totalCredit: String(amount),
            postedAt: new Date(),
          })
          .returning();

        if (je) {
          const lines: (typeof journalLines.$inferInsert)[] = [
            { journalEntryId: je.id, organizationId: orgId, accountId: cashAccountId!, description: "Payment received", debit: String(amount), credit: "0", currency: "AED", baseCurrencyDebit: String(amount), baseCurrencyCredit: "0", lineOrder: 1 },
          ];
          if (allocatedPortion > 0) {
            lines.push({ journalEntryId: je.id, organizationId: orgId, accountId: arAccount.id, description: "AR — payment received", debit: "0", credit: String(allocatedPortion), currency: "AED", baseCurrencyDebit: "0", baseCurrencyCredit: String(allocatedPortion), lineOrder: 2 });
          }
          if (unapplied > 0) {
            const [depositAcct] = await tx.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2300"))).limit(1);
            if (!depositAcct) {
              throw new Error("Customer Deposits account (2300) not found. Please add it to your Chart of Accounts.");
            }
            lines.push({ journalEntryId: je.id, organizationId: orgId, accountId: depositAcct.id, description: "Customer deposit — unapplied", debit: "0", credit: String(unapplied), currency: "AED", baseCurrencyDebit: "0", baseCurrencyCredit: String(unapplied), lineOrder: lines.length + 1 });
          }
          await tx.insert(journalLines).values(lines);
          await tx.update(payments).set({ journalEntryId: je.id }).where(eq(payments.id, payment.id));
        }
      }

      const [acc] = await tx.select({ currentBalance: bankAccounts.currentBalance }).from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
      if (acc) {
        const bal = parseFloat(acc.currentBalance ?? "0") + amount;
        await tx.update(bankAccounts).set({ currentBalance: String(bal) }).where(eq(bankAccounts.id, bankAccountId));
      }

      return { ok: true, paymentId: payment.id, bankTransactionId: bt?.id };
    }

    if (receiptType === "owner_deposit") {
      const { bankTransactionId } = await createOwnerDepositReceipt(
        orgId,
        { date, bankAccountId, amount, description, reference },
        tx
      );
      return { ok: true, bankTransactionId };
    }

    if (receiptType === "refund_received") {
      const { supplierId: sid, allocations: allocs } = body;
      const billAllocs = allocs && Array.isArray(allocs) ? allocs.filter((a): a is { billId: string; amount: number } => "billId" in a && !!a.billId) : [];
      const allocSum = billAllocs.reduce((s, a) => s + (a.amount ?? 0), 0);
      if (billAllocs.length > 0 && Math.abs(allocSum - amount) > 0.01) {
        throw new Error("Sum of bill allocations must equal amount");
      }

      if (sid) {
        const [apAccount] = await tx.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010"))).limit(1);
        if (!apAccount) throw new Error("Chart of accounts missing AP (2010)");

        const [payCount] = await tx.select({ c: count() }).from(payments).where(eq(payments.organizationId, orgId));
        const payNum = (Number(payCount?.c ?? 0) + 1).toString().padStart(4, "0");
        const ym = date.slice(0, 7).replace("-", "");
        const paymentNumber = `PAY-R-REF-${ym}-${payNum}`;

        const [payment] = await tx
          .insert(payments)
          .values({
            organizationId: orgId,
            paymentNumber,
            paymentDate: date,
            paymentType: "received",
            entityType: "supplier",
            entityId: sid,
            bankAccountId,
            amount: String(amount),
            currency: "AED",
            method: "bank_transfer",
            reference: reference ?? null,
          })
          .returning();

        if (!payment) throw new Error("Failed to create payment");

        for (const a of billAllocs) {
          await tx.insert(paymentAllocations).values({
            paymentId: payment.id,
            documentType: "bill",
            documentId: a.billId,
            amount: String(a.amount),
          });
          const [bill] = await tx.select({ amountPaid: bills.amountPaid, total: bills.total }).from(bills).where(and(eq(bills.id, a.billId), eq(bills.organizationId, orgId))).limit(1);
          if (bill) {
            const paid = Math.max(0, parseFloat(bill.amountPaid ?? "0") - a.amount);
            const total = parseFloat(bill.total ?? "0");
            await tx.update(bills).set({ amountPaid: String(paid), amountDue: String(Math.max(0, total - paid)) }).where(eq(bills.id, a.billId));
          }
        }

        const [bt] = await tx
          .insert(bankTransactions)
          .values({
            organizationId: orgId,
            bankAccountId,
            transactionDate: date,
            description: description ?? "Refund received",
            amount: String(amount),
            type: "credit",
            reference: reference ?? paymentNumber,
            category: "refund_received",
            paymentId: payment.id,
          })
          .returning();

        const periodId = await resolveOrCreatePeriod(orgId, date, tx);
        if (periodId) {
          const [entryCountRow] = await tx.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
          const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
          const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
          const [je] = await tx
            .insert(journalEntries)
            .values({
              organizationId: orgId,
              periodId,
              entryNumber,
              entryDate: date,
              description: "Refund received — Supplier",
              reference: payment.id,
              sourceType: "payment",
              sourceId: payment.id,
              status: "posted",
              currency: "AED",
              totalDebit: String(amount),
              totalCredit: String(amount),
              postedAt: new Date(),
            })
            .returning();

          if (je) {
            await tx.insert(journalLines).values([
              { journalEntryId: je.id, organizationId: orgId, accountId: cashAccountId!, description: "Refund received", debit: String(amount), credit: "0", currency: "AED", baseCurrencyDebit: String(amount), baseCurrencyCredit: "0", lineOrder: 1 },
              { journalEntryId: je.id, organizationId: orgId, accountId: apAccount.id, description: "AP — refund received", debit: "0", credit: String(amount), currency: "AED", baseCurrencyDebit: "0", baseCurrencyCredit: String(amount), lineOrder: 2 },
            ]);
            await tx.update(payments).set({ journalEntryId: je.id }).where(eq(payments.id, payment.id));
          }
        }

        const [acc] = await tx.select({ currentBalance: bankAccounts.currentBalance }).from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
        if (acc) {
          const bal = parseFloat(acc.currentBalance ?? "0") + amount;
          await tx.update(bankAccounts).set({ currentBalance: String(bal) }).where(eq(bankAccounts.id, bankAccountId));
        }

        return { ok: true, paymentId: payment.id, bankTransactionId: bt?.id };
      }

      const [bt] = await tx
        .insert(bankTransactions)
        .values({
          organizationId: orgId,
          bankAccountId,
          transactionDate: date,
          description: description ?? "Refund received",
          amount: String(amount),
          type: "credit",
          reference: reference ?? null,
          category: "refund_received",
        })
        .returning();

      const periodId = await resolveOrCreatePeriod(orgId, date, tx);
      const [equityAcct] = await tx.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "3100"))).limit(1);
      const crAccountId = equityAcct?.id ?? cashAccountId;

      if (periodId && crAccountId) {
        const [entryCountRow] = await tx.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
        const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
        const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
        const [je] = await tx
          .insert(journalEntries)
          .values({
            organizationId: orgId,
            periodId,
            entryNumber,
            entryDate: date,
            description: description ?? "Refund received",
            reference: bt?.id ?? null,
            sourceType: "manual",
            sourceId: bt?.id ?? null,
            status: "posted",
            currency: "AED",
            totalDebit: String(amount),
            totalCredit: String(amount),
            postedAt: new Date(),
          })
          .returning({ id: journalEntries.id });
        if (je) {
          await tx.insert(journalLines).values([
            { journalEntryId: je.id, organizationId: orgId, accountId: cashAccountId!, description: "Refund received", debit: String(amount), credit: "0", currency: "AED", baseCurrencyDebit: String(amount), baseCurrencyCredit: "0", lineOrder: 1 },
            { journalEntryId: je.id, organizationId: orgId, accountId: crAccountId, description: "Refund — equity", debit: "0", credit: String(amount), currency: "AED", baseCurrencyDebit: "0", baseCurrencyCredit: String(amount), lineOrder: 2 },
          ]);
        }
      }

      const [acc] = await tx.select({ currentBalance: bankAccounts.currentBalance }).from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
      if (acc) {
        const bal = parseFloat(acc.currentBalance ?? "0") + amount;
        await tx.update(bankAccounts).set({ currentBalance: String(bal) }).where(eq(bankAccounts.id, bankAccountId));
      }

      return { ok: true, bankTransactionId: bt?.id };
    }

    throw new Error("Invalid receiptType");
    });

    // Auto-send payment receipt email if org setting enabled
    if (receiptType === "customer_payment" && result.ok && body.customerId) {
      try {
        const [org] = await db
          .select({ autoSend: organizations.autoSendOnPaymentReceipt })
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);
        if (org?.autoSend) {
          const [cust] = await db
            .select({ name: customers.name, email: customers.email })
            .from(customers)
            .where(and(eq(customers.id, body.customerId), eq(customers.organizationId, orgId)))
            .limit(1);
          if (cust?.email) {
            const senderId = (await getSessionUserId()) ?? "system";
            sendDocumentEmail({
              documentType: "payment_receipt",
              documentId: result.paymentId,
              recipientEmail: cust.email,
              recipientName: cust.name,
              senderId,
              orgId,
              data: {
                payment: {
                  amount: String(amount),
                  date,
                  reference,
                },
                customer: { name: cust.name, email: cust.email },
              },
            }).catch((err) => console.error("[auto-send-receipt] email failed:", err));
          }
        }
      } catch (err) {
        console.error("[auto-send-receipt] error:", err);
      }
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create receipt";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
