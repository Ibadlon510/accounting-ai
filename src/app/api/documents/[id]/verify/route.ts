import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  documents,
  documentTransactions,
  documentTransactionLines,
  merchantMaps,
  chartOfAccounts,
  journalEntries,
  journalLines,
  accountingPeriods,
  fiscalYears,
  invoices,
  invoiceLines,
  bills,
  billLines,
  bankTransactions,
  payments,
  paymentAllocations,
  bankAccounts,
} from "@/lib/db/schema";
import { eq, and, lte, gte, count } from "drizzle-orm";
import { moveToRetentionVault, isVaultConfigured } from "@/lib/storage/vault";
import { auditLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

type LineInput = { id?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type ExpenseLineInput = LineInput & { glAccountId: string };
type BankTxnInput = { date: string; description: string; amount: number; type: "debit" | "credit"; reference?: string; balance?: number };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: documentId } = await params;
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, orgId)))
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status === "PROCESSED") {
    return NextResponse.json({ error: "Document already verified" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const docType = (body as { documentType?: string })?.documentType ?? "expense";

  if (docType === "invoice") {
    return handleInvoice(body as { customerId: string; customerName: string; issueDate: string; dueDate: string; lines: LineInput[]; subtotal: number; taxAmount: number; total: number }, orgId, documentId, doc);
  }
  if (docType === "bill") {
    return handleBill(body as { supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; lines: LineInput[]; subtotal: number; taxAmount: number; total: number }, orgId, documentId, doc);
  }
  if (docType === "bank_statement") {
    return handleBankStatement(body as { bankAccountId: string; transactions: BankTxnInput[] }, orgId, documentId, doc);
  }
  if (docType === "receipt") {
    const receiptBody = body as { receiptType: "sales" | "purchase"; date: string; customerId?: string; supplierId?: string; totalAmount: number; allocations: { invoiceId?: string; billId?: string; amount: number }[]; bankAccountId?: string };
    if (receiptBody.receiptType === "sales") {
      if (!receiptBody.customerId) return NextResponse.json({ error: "Missing customerId for sales receipt" }, { status: 400 });
      return handleSalesReceipt({ ...receiptBody, customerId: receiptBody.customerId, allocations: receiptBody.allocations.map((a) => ({ invoiceId: a.invoiceId ?? "", amount: a.amount })) }, orgId, documentId, doc);
    }
    if (receiptBody.receiptType === "purchase") {
      if (!receiptBody.supplierId) return NextResponse.json({ error: "Missing supplierId for purchase receipt" }, { status: 400 });
      return handlePurchaseReceipt({ ...receiptBody, supplierId: receiptBody.supplierId, allocations: receiptBody.allocations.map((a) => ({ billId: a.billId ?? "", amount: a.amount })) }, orgId, documentId, doc);
    }
    return NextResponse.json({ error: "Receipt must specify receiptType: sales or purchase" }, { status: 400 });
  }
  if (docType === "credit_note") {
    return handleCreditNote(body as { creditNoteType: "sales" | "purchase"; date: string; customerId?: string; customerName?: string; supplierId?: string; supplierName?: string; creditNoteNumber?: string; lines: LineInput[]; subtotal: number; taxAmount: number; total: number; linkedInvoiceId?: string; linkedBillId?: string }, orgId, documentId, doc);
  }

  return handleExpense(body as { date: string; totalAmount?: number; vatAmount?: number; netAmount?: number; currency?: string; merchantName: string; supplierId?: string; glAccountId?: string; lines?: ExpenseLineInput[]; subtotal?: number; taxAmount?: number; total?: number }, orgId, documentId, doc);
}

async function moveToVaultAndMarkProcessed(doc: { s3Key: string }, documentId: string, orgId: string) {
  const fileName = doc.s3Key.split("/").pop() ?? "document";
  let newS3Key = doc.s3Key;
  if (isVaultConfigured()) {
    const movedKey = await moveToRetentionVault({
      sourceKey: doc.s3Key,
      orgId,
      documentId,
      fileName,
    });
    if (movedKey) newS3Key = movedKey;
  }
  await db.update(documents).set({ s3Key: newS3Key, status: "PROCESSED" }).where(eq(documents.id, documentId));
}

async function resolveOrCreatePeriod(orgId: string, txnDate: string): Promise<string | null> {
  const [existing] = await db
    .select({ id: accountingPeriods.id })
    .from(accountingPeriods)
    .where(and(eq(accountingPeriods.organizationId, orgId), lte(accountingPeriods.startDate, txnDate), gte(accountingPeriods.endDate, txnDate)))
    .limit(1);
  if (existing) return existing.id;

  const d = new Date(txnDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const fyStart = `${year}-01-01`;
  const fyEnd = `${year}-12-31`;
  const fyName = `FY ${year}`;

  let fyId: string;
  const [existingFy] = await db.select({ id: fiscalYears.id }).from(fiscalYears).where(and(eq(fiscalYears.organizationId, orgId), eq(fiscalYears.name, fyName))).limit(1);
  if (existingFy) {
    fyId = existingFy.id;
  } else {
    const [newFy] = await db.insert(fiscalYears).values({ organizationId: orgId, name: fyName, startDate: fyStart, endDate: fyEnd }).returning({ id: fiscalYears.id });
    if (!newFy) return null;
    fyId = newFy.id;
  }

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const periodName = `${monthNames[month]} ${year}`;

  const [newPeriod] = await db
    .insert(accountingPeriods)
    .values({ organizationId: orgId, fiscalYearId: fyId, name: periodName, startDate: monthStart, endDate: monthEnd, status: "open" })
    .returning({ id: accountingPeriods.id });
  return newPeriod?.id ?? null;
}

async function handleExpense(
  body: {
    date: string;
    totalAmount?: number;
    vatAmount?: number;
    netAmount?: number;
    currency?: string;
    merchantName: string;
    supplierId?: string;
    glAccountId?: string;
    lines?: ExpenseLineInput[];
    subtotal?: number;
    taxAmount?: number;
    total?: number;
  },
  orgId: string,
  documentId: string,
  doc: { s3Key: string }
) {
  const { date, currency = "AED", merchantName } = body;
  const useLines = body.lines && body.lines.length > 0;
  const totalAmount = useLines ? (body.total ?? 0) : (body.totalAmount ?? 0);
  const vatAmount = useLines ? (body.taxAmount ?? 0) : (body.vatAmount ?? 0);
  const netAmount = useLines ? (body.subtotal ?? 0) : (body.netAmount ?? 0);

  if (!date || !merchantName?.trim()) {
    return NextResponse.json({ error: "Missing: date, merchantName" }, { status: 400 });
  }
  if (typeof totalAmount !== "number" || totalAmount <= 0) {
    return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
  }
  if (useLines) {
    for (const line of body.lines!) {
      if (!line.glAccountId || !line.description?.trim()) {
        return NextResponse.json({ error: "Each line must have description and GL account" }, { status: 400 });
      }
      const [gl] = await db.select().from(chartOfAccounts).where(and(eq(chartOfAccounts.id, line.glAccountId), eq(chartOfAccounts.organizationId, orgId))).limit(1);
      if (!gl) return NextResponse.json({ error: `Invalid GL account for line: ${line.description}` }, { status: 400 });
    }
  } else {
    if (!body.glAccountId) return NextResponse.json({ error: "Missing glAccountId for single-line expense" }, { status: 400 });
    const [gl] = await db.select().from(chartOfAccounts).where(and(eq(chartOfAccounts.id, body.glAccountId), eq(chartOfAccounts.organizationId, orgId))).limit(1);
    if (!gl) return NextResponse.json({ error: "Invalid GL account" }, { status: 400 });
  }

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const [dtRow] = await db
    .insert(documentTransactions)
    .values({
      documentId,
      organizationId: orgId,
      date,
      totalAmount: String(totalAmount),
      vatAmount: String(vatAmount),
      netAmount: String(netAmount),
      currency,
      merchantName: merchantName.trim(),
      supplierId: body.supplierId?.trim() || null,
      glAccountId: useLines ? null : body.glAccountId ?? null,
    })
    .returning();

  if (useLines && dtRow) {
    for (let i = 0; i < body.lines!.length; i++) {
      const l = body.lines![i];
      await db.insert(documentTransactionLines).values({
        documentTransactionId: dtRow.id,
        description: l.description.trim(),
        quantity: String(l.quantity ?? 1),
        unitPrice: String(l.unitPrice ?? 0),
        amount: String(l.amount ?? 0),
        taxRate: String(l.taxRate ?? 5),
        taxAmount: String(l.taxAmount ?? 0),
        glAccountId: l.glAccountId,
        lineOrder: i + 1,
      });
    }
  }

  const firstGlId = useLines ? body.lines![0].glAccountId : body.glAccountId!;
  const periodId = await resolveOrCreatePeriod(orgId, date);
  if (periodId) {
    const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
    const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const ym = date.slice(0, 7).replace("-", "");
    const entryNumber = `JE-${ym}-${seq}`;

    const [je] = await db
      .insert(journalEntries)
      .values({
        organizationId: orgId,
        periodId,
        entryNumber,
        entryDate: date,
        description: `Purchase — ${merchantName.trim()}`,
        reference: documentId,
        sourceType: "document",
        sourceId: documentId,
        status: "posted",
        currency,
        totalDebit: String(totalAmount),
        totalCredit: String(totalAmount),
        postedAt: new Date(),
      })
      .returning({ id: journalEntries.id });

    if (je) {
      const jl: (typeof journalLines.$inferInsert)[] = [];
      let lineOrder = 1;

      if (useLines && body.lines) {
        for (const l of body.lines) {
          const net = Number(l.amount) || 0;
          const tax = Number(l.taxAmount) || 0;
          if (net > 0) {
            jl.push({
              journalEntryId: je.id,
              organizationId: orgId,
              accountId: l.glAccountId,
              description: `${merchantName.trim()} — ${l.description.trim()}`,
              debit: String(net),
              credit: "0",
              currency,
              baseCurrencyDebit: String(net),
              baseCurrencyCredit: "0",
              lineOrder: lineOrder++,
            });
          }
          if (tax > 0) {
            const [vatInputAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450"))).limit(1);
            if (vatInputAccount) {
              jl.push({
                journalEntryId: je.id,
                organizationId: orgId,
                accountId: vatInputAccount.id,
                description: `VAT input — ${l.description.trim()}`,
                debit: String(tax),
                credit: "0",
                currency,
                baseCurrencyDebit: String(tax),
                baseCurrencyCredit: "0",
                taxCode: "VAT5",
                taxAmount: String(tax),
                lineOrder: lineOrder++,
              });
            }
          }
        }
      } else {
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: firstGlId,
          description: `${merchantName.trim()} — expense`,
          debit: String(netAmount),
          credit: "0",
          currency,
          baseCurrencyDebit: String(netAmount),
          baseCurrencyCredit: "0",
          lineOrder: lineOrder++,
        });
        if (vatAmount > 0) {
          const [vatInputAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450"))).limit(1);
          if (vatInputAccount) {
            jl.push({
              journalEntryId: je.id,
              organizationId: orgId,
              accountId: vatInputAccount.id,
              description: `VAT input — ${merchantName.trim()}`,
              debit: String(vatAmount),
              credit: "0",
              currency,
              baseCurrencyDebit: String(vatAmount),
              baseCurrencyCredit: "0",
              taxCode: "VAT5",
              taxAmount: String(vatAmount),
              lineOrder: lineOrder++,
            });
          }
        }
      }

      const [apAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010"))).limit(1);
      if (apAccount) {
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: apAccount.id,
          description: `Payable — ${merchantName.trim()}`,
          debit: "0",
          credit: String(totalAmount),
          currency,
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(totalAmount),
          lineOrder: lineOrder++,
        });
      }
      if (jl.length > 0) await db.insert(journalLines).values(jl);
    }
  }

  await db.insert(merchantMaps).values({ organizationId: orgId, merchantName: merchantName.trim().toUpperCase(), glAccountId: firstGlId, confidence: "1" }).onConflictDoUpdate({
    target: [merchantMaps.organizationId, merchantMaps.merchantName],
    set: { glAccountId: firstGlId, lastUsed: new Date(), confidence: "1" },
  });

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { merchantName: merchantName.trim(), glAccountId: firstGlId } });

  return NextResponse.json({ ok: true });
}

async function handleInvoice(
  body: { customerId: string; customerName: string; issueDate: string; dueDate: string; lines: LineInput[]; subtotal: number; taxAmount: number; total: number },
  orgId: string,
  documentId: string,
  doc: { s3Key: string }
) {
  const { customerId, customerName, issueDate, dueDate, lines, subtotal, taxAmount, total } = body;
  if (!customerId || !issueDate || !dueDate || !lines?.length || typeof subtotal !== "number" || typeof total !== "number") {
    return NextResponse.json({ error: "Missing or invalid: customerId, issueDate, dueDate, lines, subtotal, total" }, { status: 400 });
  }

  const [invCount] = await db.select({ c: count() }).from(invoices).where(eq(invoices.organizationId, orgId));
  const invNum = `INV-${issueDate.slice(0, 7).replace("-", "")}-${String(Number(invCount?.c ?? 0) + 1).padStart(3, "0")}`;

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const [inv] = await db
    .insert(invoices)
    .values({
      organizationId: orgId,
      customerId,
      invoiceNumber: invNum,
      issueDate,
      dueDate,
      status: "draft",
      currency: "AED",
      subtotal: String(subtotal),
      taxAmount: String(taxAmount ?? 0),
      total: String(total),
      amountPaid: "0",
      amountDue: String(total),
      documentId,
    })
    .returning({ id: invoices.id });

  if (!inv) return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    await db.insert(invoiceLines).values({
      invoiceId: inv.id,
      description: l.description || "Line item",
      quantity: String(l.quantity ?? 1),
      unitPrice: String(l.unitPrice ?? 0),
      amount: String(l.amount ?? 0),
      taxRate: String(l.taxRate ?? 5),
      taxAmount: String(l.taxAmount ?? 0),
      lineOrder: i + 1,
    });
  }

  const periodId = await resolveOrCreatePeriod(orgId, issueDate);
  if (periodId) {
    const [arAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1210"))).limit(1);
    const [salesAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "4000"))).limit(1);
    const [vatAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2200"))).limit(1);

    if (arAccount && salesAccount) {
      const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
      const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const ym = issueDate.slice(0, 7).replace("-", "");
      const entryNumber = `JE-${ym}-${seq}`;

      const [je] = await db
        .insert(journalEntries)
        .values({
          organizationId: orgId,
          periodId,
          entryNumber,
          entryDate: issueDate,
          description: `Sales Invoice ${invNum} — ${customerName}`,
          reference: inv.id,
          sourceType: "invoice",
          sourceId: inv.id,
          status: "posted",
          currency: "AED",
          totalDebit: String(total),
          totalCredit: String(total),
          postedAt: new Date(),
        })
        .returning({ id: journalEntries.id });

      if (je) {
        const jl: (typeof journalLines.$inferInsert)[] = [];
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: arAccount.id,
          description: `AR — ${customerName}`,
          debit: String(total),
          credit: "0",
          currency: "AED",
          baseCurrencyDebit: String(total),
          baseCurrencyCredit: "0",
          lineOrder: 1,
        });
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: salesAccount.id,
          description: `Revenue — ${customerName}`,
          debit: "0",
          credit: String(subtotal),
          currency: "AED",
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(subtotal),
          lineOrder: 2,
        });
        if (taxAmount > 0 && vatAccount) {
          jl.push({
            journalEntryId: je.id,
            organizationId: orgId,
            accountId: vatAccount.id,
            description: `VAT output — ${customerName}`,
            debit: "0",
            credit: String(taxAmount),
            currency: "AED",
            baseCurrencyDebit: "0",
            baseCurrencyCredit: String(taxAmount),
            taxCode: "VAT5",
            taxAmount: String(taxAmount),
            lineOrder: 3,
          });
        }
        await db.insert(journalLines).values(jl);
      }
      await db.update(invoices).set({ journalEntryId: je?.id }).where(eq(invoices.id, inv.id));
    }
  }

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "invoice", invoiceId: inv.id } });

  return NextResponse.json({ ok: true });
}

async function handleBill(
  body: { supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; lines: (LineInput & { glAccountId?: string })[]; subtotal: number; taxAmount: number; total: number },
  orgId: string,
  documentId: string,
  doc: { s3Key: string }
) {
  const { supplierId, supplierName, billNumber, issueDate, dueDate, lines, subtotal, taxAmount, total } = body;
  if (!supplierId || !billNumber?.trim() || !issueDate || !dueDate || !lines?.length || typeof subtotal !== "number" || typeof total !== "number") {
    return NextResponse.json({ error: "Missing or invalid: supplierId, billNumber, issueDate, dueDate, lines, subtotal, total" }, { status: 400 });
  }

  const [defaultExpenseAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "6300"))).limit(1);
  const defaultGlId = defaultExpenseAccount?.id;

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const [bill] = await db
    .insert(bills)
    .values({
      organizationId: orgId,
      supplierId,
      billNumber: billNumber.trim(),
      issueDate,
      dueDate,
      status: "received",
      currency: "AED",
      subtotal: String(subtotal),
      taxAmount: String(taxAmount ?? 0),
      total: String(total),
      amountPaid: "0",
      amountDue: String(total),
      documentId,
    })
    .returning({ id: bills.id });

  if (!bill) return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    await db.insert(billLines).values({
      billId: bill.id,
      description: l.description || "Line item",
      quantity: String(l.quantity ?? 1),
      unitPrice: String(l.unitPrice ?? 0),
      amount: String(l.amount ?? 0),
      taxRate: String(l.taxRate ?? 5),
      taxAmount: String(l.taxAmount ?? 0),
      accountId: l.glAccountId ?? defaultGlId ?? undefined,
      lineOrder: i + 1,
    });
  }

  const periodId = await resolveOrCreatePeriod(orgId, issueDate);
  if (periodId) {
    const [vatInputAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450"))).limit(1);
    const [apAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010"))).limit(1);

    if (apAccount) {
      const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
      const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const ym = issueDate.slice(0, 7).replace("-", "");
      const entryNumber = `JE-${ym}-${seq}`;

      const [je] = await db
        .insert(journalEntries)
        .values({
          organizationId: orgId,
          periodId,
          entryNumber,
          entryDate: issueDate,
          description: `Bill ${billNumber} — ${supplierName}`,
          reference: bill.id,
          sourceType: "bill",
          sourceId: bill.id,
          status: "posted",
          currency: "AED",
          totalDebit: String(total),
          totalCredit: String(total),
          postedAt: new Date(),
        })
        .returning({ id: journalEntries.id });

      if (je) {
        const jl: (typeof journalLines.$inferInsert)[] = [];
        let lineOrder = 1;
        for (const l of lines) {
          const lineGl = l.glAccountId || defaultGlId;
          const net = Number(l.amount) || 0;
          const tax = Number(l.taxAmount) || 0;
          if (net > 0 && lineGl) {
            jl.push({
              journalEntryId: je.id,
              organizationId: orgId,
              accountId: lineGl,
              description: `${supplierName} — ${l.description?.trim() || "expense"}`,
              debit: String(net),
              credit: "0",
              currency: "AED",
              baseCurrencyDebit: String(net),
              baseCurrencyCredit: "0",
              lineOrder: lineOrder++,
            });
          }
          if (tax > 0 && vatInputAccount) {
            jl.push({
              journalEntryId: je.id,
              organizationId: orgId,
              accountId: vatInputAccount.id,
              description: `VAT input — ${l.description?.trim() || supplierName}`,
              debit: String(tax),
              credit: "0",
              currency: "AED",
              baseCurrencyDebit: String(tax),
              baseCurrencyCredit: "0",
              taxCode: "VAT5",
              taxAmount: String(tax),
              lineOrder: lineOrder++,
            });
          }
        }
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: apAccount.id,
          description: `Payable — ${supplierName}`,
          debit: "0",
          credit: String(total),
          currency: "AED",
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(total),
          lineOrder: lineOrder++,
        });
        await db.insert(journalLines).values(jl);
      }
      await db.update(bills).set({ journalEntryId: je?.id }).where(eq(bills.id, bill.id));
    }
  }

  const firstGlId = lines[0]?.glAccountId || defaultGlId;
  if (firstGlId) {
    await db.insert(merchantMaps).values({ organizationId: orgId, merchantName: supplierName.trim().toUpperCase(), glAccountId: firstGlId, confidence: "1" }).onConflictDoUpdate({
      target: [merchantMaps.organizationId, merchantMaps.merchantName],
      set: { glAccountId: firstGlId, lastUsed: new Date(), confidence: "1" },
    });
  }

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "bill", billId: bill.id } });

  return NextResponse.json({ ok: true });
}

async function handleSalesReceipt(
  body: { date: string; customerId: string; totalAmount: number; allocations: { invoiceId: string; amount: number }[]; bankAccountId?: string },
  orgId: string,
  documentId: string,
  doc: { s3Key: string }
) {
  const { date, customerId, totalAmount, allocations, bankAccountId } = body;
  if (!date || !customerId || typeof totalAmount !== "number" || !Array.isArray(allocations) || allocations.length === 0) {
    return NextResponse.json({ error: "Missing: date, customerId, totalAmount, allocations" }, { status: 400 });
  }
  const allocSum = allocations.reduce((s, a) => s + (a.amount ?? 0), 0);
  if (Math.abs(allocSum - totalAmount) > 0.01) {
    return NextResponse.json({ error: "Sum of allocations must equal totalAmount" }, { status: 400 });
  }

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const [payCount] = await db.select({ c: count() }).from(payments).where(eq(payments.organizationId, orgId));
  const payNum = (Number(payCount?.c ?? 0) + 1).toString().padStart(4, "0");
  const ym = date.slice(0, 7).replace("-", "");
  const paymentNumber = `PAY-R-${ym}-${payNum}`;

  let cashAccountId: string | null = null;
  if (bankAccountId) {
    const [ba] = await db.select({ ledgerAccountId: bankAccounts.ledgerAccountId }).from(bankAccounts).where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId))).limit(1);
    cashAccountId = ba?.ledgerAccountId ?? null;
  }
  if (!cashAccountId) {
    const [cashAcct] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010"))).limit(1);
    cashAccountId = cashAcct?.id ?? null;
  }
  const [arAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1210"))).limit(1);
  if (!arAccount || !cashAccountId) {
    return NextResponse.json({ error: "Chart of accounts missing cash (1010) or AR (1210)" }, { status: 400 });
  }

  const [payment] = await db
    .insert(payments)
    .values({
      organizationId: orgId,
      paymentNumber,
      paymentDate: date,
      paymentType: "received",
      entityType: "customer",
      entityId: customerId,
      bankAccountId: bankAccountId ?? null,
      amount: String(totalAmount),
      currency: "AED",
      method: "bank_transfer",
      reference: documentId,
    })
    .returning();

  if (!payment) return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });

  for (const a of allocations) {
    await db.insert(paymentAllocations).values({
      paymentId: payment.id,
      documentType: "invoice",
      documentId: a.invoiceId,
      amount: String(a.amount),
    });
    const [inv] = await db.select({ amountPaid: invoices.amountPaid, total: invoices.total }).from(invoices).where(and(eq(invoices.id, a.invoiceId), eq(invoices.organizationId, orgId))).limit(1);
    if (inv) {
      const paid = parseFloat(inv.amountPaid ?? "0") + a.amount;
      const total = parseFloat(inv.total ?? "0");
      await db.update(invoices).set({ amountPaid: String(paid), amountDue: String(Math.max(0, total - paid)) }).where(eq(invoices.id, a.invoiceId));
    }
  }

  const periodId = await resolveOrCreatePeriod(orgId, date);
  if (periodId) {
    const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
    const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
    const [je] = await db
      .insert(journalEntries)
      .values({
        organizationId: orgId,
        periodId,
        entryNumber,
        entryDate: date,
        description: `Payment received — Receipt`,
        reference: payment.id,
        sourceType: "payment",
        sourceId: payment.id,
        status: "posted",
        currency: "AED",
        totalDebit: String(totalAmount),
        totalCredit: String(totalAmount),
        postedAt: new Date(),
      })
      .returning();

    if (je) {
      await db.insert(journalLines).values([
        {
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: cashAccountId,
          description: "Payment received",
          debit: String(totalAmount),
          credit: "0",
          currency: "AED",
          baseCurrencyDebit: String(totalAmount),
          baseCurrencyCredit: "0",
          lineOrder: 1,
        },
        {
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: arAccount.id,
          description: "AR — payment received",
          debit: "0",
          credit: String(totalAmount),
          currency: "AED",
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(totalAmount),
          lineOrder: 2,
        },
      ]);
      await db.update(payments).set({ journalEntryId: je.id }).where(eq(payments.id, payment.id));
    }
  }

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "receipt", receiptType: "sales", paymentId: payment.id } });

  return NextResponse.json({ ok: true });
}

async function handlePurchaseReceipt(
  body: { date: string; supplierId: string; totalAmount: number; allocations: { billId: string; amount: number }[]; bankAccountId?: string },
  orgId: string,
  documentId: string,
  doc: { s3Key: string }
) {
  const { date, supplierId, totalAmount, allocations, bankAccountId } = body;
  if (!date || !supplierId || typeof totalAmount !== "number" || !Array.isArray(allocations) || allocations.length === 0) {
    return NextResponse.json({ error: "Missing: date, supplierId, totalAmount, allocations" }, { status: 400 });
  }
  const allocSum = allocations.reduce((s, a) => s + (a.amount ?? 0), 0);
  if (Math.abs(allocSum - totalAmount) > 0.01) {
    return NextResponse.json({ error: "Sum of allocations must equal totalAmount" }, { status: 400 });
  }

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const [payCount] = await db.select({ c: count() }).from(payments).where(eq(payments.organizationId, orgId));
  const payNum = (Number(payCount?.c ?? 0) + 1).toString().padStart(4, "0");
  const ym = date.slice(0, 7).replace("-", "");
  const paymentNumber = `PAY-M-${ym}-${payNum}`;

  let cashAccountId: string | null = null;
  if (bankAccountId) {
    const [ba] = await db.select({ ledgerAccountId: bankAccounts.ledgerAccountId }).from(bankAccounts).where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId))).limit(1);
    cashAccountId = ba?.ledgerAccountId ?? null;
  }
  if (!cashAccountId) {
    const [cashAcct] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010"))).limit(1);
    cashAccountId = cashAcct?.id ?? null;
  }
  const [apAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010"))).limit(1);
  if (!apAccount || !cashAccountId) {
    return NextResponse.json({ error: "Chart of accounts missing cash (1010) or AP (2010)" }, { status: 400 });
  }

  const [payment] = await db
    .insert(payments)
    .values({
      organizationId: orgId,
      paymentNumber,
      paymentDate: date,
      paymentType: "made",
      entityType: "supplier",
      entityId: supplierId,
      bankAccountId: bankAccountId ?? null,
      amount: String(totalAmount),
      currency: "AED",
      method: "bank_transfer",
      reference: documentId,
    })
    .returning();

  if (!payment) return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });

  for (const a of allocations) {
    await db.insert(paymentAllocations).values({
      paymentId: payment.id,
      documentType: "bill",
      documentId: a.billId,
      amount: String(a.amount),
    });
    const [bill] = await db.select({ amountPaid: bills.amountPaid, total: bills.total }).from(bills).where(and(eq(bills.id, a.billId), eq(bills.organizationId, orgId))).limit(1);
    if (bill) {
      const paid = parseFloat(bill.amountPaid ?? "0") + a.amount;
      const total = parseFloat(bill.total ?? "0");
      await db.update(bills).set({ amountPaid: String(paid), amountDue: String(Math.max(0, total - paid)) }).where(eq(bills.id, a.billId));
    }
  }

  const periodId = await resolveOrCreatePeriod(orgId, date);
  if (periodId) {
    const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
    const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
    const [je] = await db
      .insert(journalEntries)
      .values({
        organizationId: orgId,
        periodId,
        entryNumber,
        entryDate: date,
        description: `Payment made — Receipt`,
        reference: payment.id,
        sourceType: "payment",
        sourceId: payment.id,
        status: "posted",
        currency: "AED",
        totalDebit: String(totalAmount),
        totalCredit: String(totalAmount),
        postedAt: new Date(),
      })
      .returning();

    if (je) {
      await db.insert(journalLines).values([
        {
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: apAccount.id,
          description: "AP — payment made",
          debit: String(totalAmount),
          credit: "0",
          currency: "AED",
          baseCurrencyDebit: String(totalAmount),
          baseCurrencyCredit: "0",
          lineOrder: 1,
        },
        {
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: cashAccountId,
          description: "Payment made",
          debit: "0",
          credit: String(totalAmount),
          currency: "AED",
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(totalAmount),
          lineOrder: 2,
        },
      ]);
      await db.update(payments).set({ journalEntryId: je.id }).where(eq(payments.id, payment.id));
    }
  }

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "receipt", receiptType: "purchase", paymentId: payment.id } });

  return NextResponse.json({ ok: true });
}

async function handleBankStatement(body: { bankAccountId: string; transactions: BankTxnInput[] }, orgId: string, documentId: string, doc: { s3Key: string }) {
  const { bankAccountId, transactions } = body;
  if (!bankAccountId || !Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ error: "Missing or invalid: bankAccountId, transactions" }, { status: 400 });
  }

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const batchId = `doc-${documentId}-${Date.now()}`;
  for (const t of transactions) {
    await db.insert(bankTransactions).values({
      organizationId: orgId,
      bankAccountId,
      transactionDate: t.date || new Date().toISOString().slice(0, 10),
      description: t.description || "Imported",
      amount: String(t.amount ?? 0),
      type: t.type ?? "debit",
      reference: t.reference ?? null,
      importBatch: batchId,
    });
  }

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "bank_statement", count: transactions.length } });

  return NextResponse.json({ ok: true });
}

async function handleCreditNote(
  body: {
    creditNoteType: "sales" | "purchase";
    date: string;
    customerId?: string;
    customerName?: string;
    supplierId?: string;
    supplierName?: string;
    creditNoteNumber?: string;
    lines: LineInput[];
    subtotal: number;
    taxAmount: number;
    total: number;
    linkedInvoiceId?: string;
    linkedBillId?: string;
  },
  orgId: string,
  documentId: string,
  doc: { s3Key: string }
) {
  const { creditNoteType, date, lines, subtotal, taxAmount, total } = body;
  if (!date || !creditNoteType || !lines?.length || typeof subtotal !== "number" || typeof total !== "number") {
    return NextResponse.json({ error: "Missing: creditNoteType, date, lines, subtotal, total" }, { status: 400 });
  }

  await moveToVaultAndMarkProcessed(doc, documentId, orgId);

  const periodId = await resolveOrCreatePeriod(orgId, date);

  if (creditNoteType === "sales") {
    const { customerId, customerName, creditNoteNumber, linkedInvoiceId } = body;
    if (!customerId) return NextResponse.json({ error: "Missing customerId for sales credit note" }, { status: 400 });

    const cnNum = creditNoteNumber?.trim() || `CN-S-${date.slice(0, 7).replace("-", "")}-${Date.now().toString(36)}`;

    const [inv] = await db
      .insert(invoices)
      .values({
        organizationId: orgId,
        customerId,
        invoiceNumber: cnNum,
        issueDate: date,
        dueDate: date,
        status: "paid",
        currency: "AED",
        subtotal: String(-subtotal),
        taxAmount: String(-(taxAmount ?? 0)),
        total: String(-total),
        amountPaid: String(-total),
        amountDue: "0",
        notes: `Credit note${linkedInvoiceId ? ` against invoice` : ""}`,
        documentId,
      })
      .returning({ id: invoices.id });

    if (!inv) return NextResponse.json({ error: "Failed to create credit note invoice" }, { status: 500 });

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await db.insert(invoiceLines).values({
        invoiceId: inv.id,
        description: l.description || "Credit line",
        quantity: String(l.quantity ?? 1),
        unitPrice: String(l.unitPrice ?? 0),
        amount: String(l.amount ?? 0),
        taxRate: String(l.taxRate ?? 5),
        taxAmount: String(l.taxAmount ?? 0),
        lineOrder: i + 1,
      });
    }

    if (linkedInvoiceId) {
      const [origInv] = await db.select({ amountDue: invoices.amountDue, total: invoices.total }).from(invoices).where(and(eq(invoices.id, linkedInvoiceId), eq(invoices.organizationId, orgId))).limit(1);
      if (origInv) {
        const newDue = Math.max(0, parseFloat(origInv.amountDue ?? "0") - total);
        const newPaid = parseFloat(origInv.total ?? "0") - newDue;
        await db.update(invoices).set({ amountPaid: String(newPaid), amountDue: String(newDue) }).where(eq(invoices.id, linkedInvoiceId));
      }
    }

    if (periodId) {
      const [arAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1210"))).limit(1);
      const [salesAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "4000"))).limit(1);
      const [vatAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2200"))).limit(1);

      if (arAccount && salesAccount) {
        const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
        const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
        const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;

        const [je] = await db
          .insert(journalEntries)
          .values({
            organizationId: orgId,
            periodId,
            entryNumber,
            entryDate: date,
            description: `Sales Credit Note ${cnNum} — ${customerName ?? "customer"}`,
            reference: inv.id,
            sourceType: "credit_note",
            sourceId: inv.id,
            status: "posted",
            currency: "AED",
            totalDebit: String(total),
            totalCredit: String(total),
            postedAt: new Date(),
          })
          .returning({ id: journalEntries.id });

        if (je) {
          const jl: (typeof journalLines.$inferInsert)[] = [];
          jl.push({
            journalEntryId: je.id,
            organizationId: orgId,
            accountId: salesAccount.id,
            description: `Revenue reversal — ${customerName ?? "customer"}`,
            debit: String(subtotal),
            credit: "0",
            currency: "AED",
            baseCurrencyDebit: String(subtotal),
            baseCurrencyCredit: "0",
            lineOrder: 1,
          });
          if (taxAmount > 0 && vatAccount) {
            jl.push({
              journalEntryId: je.id,
              organizationId: orgId,
              accountId: vatAccount.id,
              description: `VAT output reversal — ${customerName ?? "customer"}`,
              debit: String(taxAmount),
              credit: "0",
              currency: "AED",
              baseCurrencyDebit: String(taxAmount),
              baseCurrencyCredit: "0",
              taxCode: "VAT5",
              taxAmount: String(taxAmount),
              lineOrder: 2,
            });
          }
          jl.push({
            journalEntryId: je.id,
            organizationId: orgId,
            accountId: arAccount.id,
            description: `AR reversal — ${customerName ?? "customer"}`,
            debit: "0",
            credit: String(total),
            currency: "AED",
            baseCurrencyDebit: "0",
            baseCurrencyCredit: String(total),
            lineOrder: 3,
          });
          await db.insert(journalLines).values(jl);
        }
        await db.update(invoices).set({ journalEntryId: je?.id }).where(eq(invoices.id, inv.id));
      }
    }

    const session = await auth();
    await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "credit_note", creditNoteType: "sales", invoiceId: inv.id } });
    return NextResponse.json({ ok: true });
  }

  // Purchase credit note — reverses AP
  const { supplierId, supplierName, creditNoteNumber, linkedBillId } = body;
  if (!supplierId) return NextResponse.json({ error: "Missing supplierId for purchase credit note" }, { status: 400 });

  const cnNum = creditNoteNumber?.trim() || `CN-P-${date.slice(0, 7).replace("-", "")}-${Date.now().toString(36)}`;

  const [bill] = await db
    .insert(bills)
    .values({
      organizationId: orgId,
      supplierId,
      billNumber: cnNum,
      issueDate: date,
      dueDate: date,
      status: "paid",
      currency: "AED",
      subtotal: String(-subtotal),
      taxAmount: String(-(taxAmount ?? 0)),
      total: String(-total),
      amountPaid: String(-total),
      amountDue: "0",
      notes: `Credit note${linkedBillId ? ` against bill` : ""}`,
      documentId,
    })
    .returning({ id: bills.id });

  if (!bill) return NextResponse.json({ error: "Failed to create credit note bill" }, { status: 500 });

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    await db.insert(billLines).values({
      billId: bill.id,
      description: l.description || "Credit line",
      quantity: String(l.quantity ?? 1),
      unitPrice: String(l.unitPrice ?? 0),
      amount: String(l.amount ?? 0),
      taxRate: String(l.taxRate ?? 5),
      taxAmount: String(l.taxAmount ?? 0),
      lineOrder: i + 1,
    });
  }

  if (linkedBillId) {
    const [origBill] = await db.select({ amountDue: bills.amountDue, total: bills.total }).from(bills).where(and(eq(bills.id, linkedBillId), eq(bills.organizationId, orgId))).limit(1);
    if (origBill) {
      const newDue = Math.max(0, parseFloat(origBill.amountDue ?? "0") - total);
      const newPaid = parseFloat(origBill.total ?? "0") - newDue;
      await db.update(bills).set({ amountPaid: String(newPaid), amountDue: String(newDue) }).where(eq(bills.id, linkedBillId));
    }
  }

  if (periodId) {
    const [expenseAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "6300"))).limit(1);
    const [vatInputAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450"))).limit(1);
    const [apAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010"))).limit(1);

    if (apAccount && expenseAccount) {
      const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
      const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;

      const [je] = await db
        .insert(journalEntries)
        .values({
          organizationId: orgId,
          periodId,
          entryNumber,
          entryDate: date,
          description: `Purchase Credit Note ${cnNum} — ${supplierName ?? "supplier"}`,
          reference: bill.id,
          sourceType: "credit_note",
          sourceId: bill.id,
          status: "posted",
          currency: "AED",
          totalDebit: String(total),
          totalCredit: String(total),
          postedAt: new Date(),
        })
        .returning({ id: journalEntries.id });

      if (je) {
        const jl: (typeof journalLines.$inferInsert)[] = [];
        let lineOrder = 1;
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: apAccount.id,
          description: `AP reversal — ${supplierName ?? "supplier"}`,
          debit: String(total),
          credit: "0",
          currency: "AED",
          baseCurrencyDebit: String(total),
          baseCurrencyCredit: "0",
          lineOrder: lineOrder++,
        });
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: expenseAccount.id,
          description: `Expense reversal — ${supplierName ?? "supplier"}`,
          debit: "0",
          credit: String(subtotal),
          currency: "AED",
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(subtotal),
          lineOrder: lineOrder++,
        });
        if (taxAmount > 0 && vatInputAccount) {
          jl.push({
            journalEntryId: je.id,
            organizationId: orgId,
            accountId: vatInputAccount.id,
            description: `VAT input reversal — ${supplierName ?? "supplier"}`,
            debit: "0",
            credit: String(taxAmount),
            currency: "AED",
            baseCurrencyDebit: "0",
            baseCurrencyCredit: String(taxAmount),
            taxCode: "VAT5",
            taxAmount: String(taxAmount),
            lineOrder: lineOrder++,
          });
        }
        await db.insert(journalLines).values(jl);
      }
      await db.update(bills).set({ journalEntryId: je?.id }).where(eq(bills.id, bill.id));
    }
  }

  const session = await auth();
  await db.insert(auditLogs).values({ organizationId: orgId, userId: session?.user?.id, action: "document_verified", entity: "documents", entityId: documentId, metadata: { documentType: "credit_note", creditNoteType: "purchase", billId: bill.id } });
  return NextResponse.json({ ok: true });
}
