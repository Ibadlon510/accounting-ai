import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceLines,
  customers,
  organizations,
  chartOfAccounts,
  journalEntries,
  journalLines,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";
import { sendDocumentEmail } from "@/lib/email/document-email";

async function createInvoiceJournalEntry(orgId: string, invoiceId: string) {
  const [inv] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      issueDate: invoices.issueDate,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      currency: invoices.currency,
      journalEntryId: invoices.journalEntryId,
    })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, orgId)))
    .limit(1);

  if (!inv || inv.journalEntryId) return;

  const [org] = await db
    .select({ isVatRegistered: organizations.isVatRegistered })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const [cust] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, inv.customerId)).limit(1);
  const customerName = cust?.name ?? "Customer";

  const total = parseFloat(inv.total ?? "0");
  const subtotal = parseFloat(inv.subtotal ?? "0");
  const taxAmount = parseFloat(inv.taxAmount ?? "0");
  if (total <= 0) return;

  const periodId = await resolveOrCreatePeriod(orgId, inv.issueDate);
  if (!periodId) return;

  const [arAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1210"))).limit(1);
  const [salesAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "4000"))).limit(1);
  const [vatAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2200"))).limit(1);

  if (!arAccount || !salesAccount) return;

  const lines = await db
    .select({ taxCode: invoiceLines.taxCode, taxAmount: invoiceLines.taxAmount })
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, inv.id));
  const primaryTaxCode = lines.find((l) => l.taxCode)?.taxCode || "SR";

  const ym = inv.issueDate.slice(0, 7).replace("-", "");
  const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
  const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
  const entryNumber = `JE-${ym}-${seq}`;

  const [je] = await db
    .insert(journalEntries)
    .values({
      organizationId: orgId,
      periodId,
      entryNumber,
      entryDate: inv.issueDate,
      description: `Sales Invoice ${inv.invoiceNumber} — ${customerName}`,
      reference: inv.id,
      sourceType: "invoice",
      sourceId: inv.id,
      status: "posted",
      currency: inv.currency ?? "AED",
      totalDebit: String(total),
      totalCredit: String(total),
      postedAt: new Date(),
    })
    .returning({ id: journalEntries.id });

  if (!je) return;

  const jl: (typeof journalLines.$inferInsert)[] = [];
  const cur = inv.currency ?? "AED";

  jl.push({
    journalEntryId: je.id,
    organizationId: orgId,
    accountId: arAccount.id,
    description: `AR — ${customerName}`,
    debit: String(total),
    credit: "0",
    currency: cur,
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
    currency: cur,
    baseCurrencyDebit: "0",
    baseCurrencyCredit: String(subtotal),
    lineOrder: 2,
  });
  if (org?.isVatRegistered && taxAmount > 0 && vatAccount) {
    jl.push({
      journalEntryId: je.id,
      organizationId: orgId,
      accountId: vatAccount.id,
      description: `VAT output — ${customerName}`,
      debit: "0",
      credit: String(taxAmount),
      currency: cur,
      baseCurrencyDebit: "0",
      baseCurrencyCredit: String(taxAmount),
      taxCode: primaryTaxCode,
      taxAmount: String(taxAmount),
      lineOrder: 3,
    });
  }

  if (jl.length > 0) await db.insert(journalLines).values(jl);
  await db.update(invoices).set({ journalEntryId: je.id }).where(eq(invoices.id, inv.id));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const allowedStatuses = ["draft", "sent", "paid", "partial", "overdue", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select({ id: invoices.id, status: invoices.status, journalEntryId: invoices.journalEntryId })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(invoices)
      .set({ status })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)))
      .returning({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
      });

    // Create JE when invoice moves from draft to sent/confirmed (and no JE yet)
    if (status === "sent" && existing.status === "draft" && !existing.journalEntryId) {
      await createInvoiceJournalEntry(orgId, id);
    }

    // Auto-send invoice email on confirmation if org setting enabled
    if (status === "sent" && existing.status === "draft") {
      try {
        const [org] = await db
          .select({ autoSend: organizations.autoSendOnInvoiceConfirm })
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);
        if (org?.autoSend) {
          const [inv] = await db
            .select({
              invoiceNumber: invoices.invoiceNumber,
              customerId: invoices.customerId,
              total: invoices.total,
              currency: invoices.currency,
              dueDate: invoices.dueDate,
              issueDate: invoices.issueDate,
            })
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);
          if (inv) {
            const [cust] = await db
              .select({ name: customers.name, email: customers.email })
              .from(customers)
              .where(eq(customers.id, inv.customerId))
              .limit(1);
            if (cust?.email) {
              const senderId = (await getSessionUserId()) ?? "system";
              sendDocumentEmail({
                documentType: "invoice",
                documentId: id,
                documentNumber: inv.invoiceNumber,
                recipientEmail: cust.email,
                recipientName: cust.name,
                senderId,
                orgId,
                data: {
                  invoice: {
                    id,
                    invoiceNumber: inv.invoiceNumber,
                    total: inv.total,
                    currency: inv.currency,
                    dueDate: inv.dueDate,
                    issueDate: inv.issueDate,
                  },
                  customer: { name: cust.name, email: cust.email },
                },
              }).catch((err) => console.error("[auto-send-invoice] email failed:", err));
            }
          }
        }
      } catch (err) {
        console.error("[auto-send-invoice] error:", err);
      }
    }

    return NextResponse.json({ invoice: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update invoice";
    console.error("Invoice PATCH error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
