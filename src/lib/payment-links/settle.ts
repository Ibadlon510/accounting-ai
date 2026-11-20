import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bankAccounts,
  bankTransactions,
  chartOfAccounts,
  invoicePaymentLinks,
  invoices,
  journalEntries,
  journalLines,
  paymentAllocations,
  payments,
} from "@/lib/db/schema";
import { resolveOrCreatePeriod } from "@/lib/banking/period";
import { canWrite } from "@/lib/billing/gates";

export type SettlePaymentLinkResult = {
  paymentLinkId: string;
  paymentId: string | null;
  journalEntryId: string | null;
  alreadySettled: boolean;
  status: string;
};

/**
 * Allocate a successful payment-link charge to the invoice and post an
 * immutable receipt JE: Dr bank/cash (1010 fallback) / Cr AR (1210).
 * Idempotent on providerEventId and paid status.
 */
export async function settleInvoicePaymentLink(input: {
  paymentLinkId: string;
  organizationId: string;
  providerEventId: string;
  stripePaymentIntentId?: string | null;
  paidAt?: Date;
  /** Override amount; defaults to link.amount */
  amount?: number;
}): Promise<SettlePaymentLinkResult> {
  const writeGate = await canWrite(input.organizationId);
  if (!writeGate.allowed) {
    throw new Error(writeGate.reason);
  }

  return db.transaction(async (tx) => {
    const [link] = await tx
      .select()
      .from(invoicePaymentLinks)
      .where(
        and(
          eq(invoicePaymentLinks.id, input.paymentLinkId),
          eq(invoicePaymentLinks.organizationId, input.organizationId)
        )
      )
      .limit(1);

    if (!link) {
      throw new Error("Payment link not found");
    }

    if (link.status === "paid" && link.paymentId) {
      return {
        paymentLinkId: link.id,
        paymentId: link.paymentId,
        journalEntryId: link.journalEntryId,
        alreadySettled: true,
        status: "paid",
      };
    }

    if (link.providerEventId && link.providerEventId === input.providerEventId) {
      return {
        paymentLinkId: link.id,
        paymentId: link.paymentId,
        journalEntryId: link.journalEntryId,
        alreadySettled: true,
        status: link.status,
      };
    }

    if (link.status === "cancelled" || link.status === "expired") {
      throw new Error(`Cannot settle ${link.status} payment link`);
    }

    const amount = input.amount ?? parseFloat(link.amount);
    if (!(amount > 0)) {
      throw new Error("Invalid settlement amount");
    }

    const [inv] = await tx
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, link.invoiceId),
          eq(invoices.organizationId, input.organizationId)
        )
      )
      .limit(1);

    if (!inv) throw new Error("Invoice not found");
    if (inv.status === "draft" || inv.status === "cancelled") {
      throw new Error("Cannot settle against draft or cancelled invoice");
    }

    const due = parseFloat(inv.amountDue ?? "0");
    const allocate = Math.min(amount, Math.max(0, due));
    const unapplied = Math.max(0, amount - allocate);

    let bankAccountId = link.bankAccountId;
    if (!bankAccountId) {
      const [ba] = await tx
        .select({ id: bankAccounts.id })
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.organizationId, input.organizationId),
            eq(bankAccounts.isActive, true)
          )
        )
        .limit(1);
      bankAccountId = ba?.id ?? null;
    }
    if (!bankAccountId) {
      throw new Error("No bank account available for settlement. Create a bank account first.");
    }

    const [ba] = await tx
      .select({ ledgerAccountId: bankAccounts.ledgerAccountId })
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.id, bankAccountId),
          eq(bankAccounts.organizationId, input.organizationId)
        )
      )
      .limit(1);

    let cashAccountId = ba?.ledgerAccountId ?? null;
    if (!cashAccountId) {
      const [cashAcct] = await tx
        .select({ id: chartOfAccounts.id })
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.organizationId, input.organizationId),
            eq(chartOfAccounts.code, "1010")
          )
        )
        .limit(1);
      cashAccountId = cashAcct?.id ?? null;
    }
    if (!cashAccountId) {
      throw new Error("Chart of accounts missing cash (1010) or bank ledger");
    }

    const [arAccount] = await tx
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(
        and(
          eq(chartOfAccounts.organizationId, input.organizationId),
          eq(chartOfAccounts.code, "1210")
        )
      )
      .limit(1);
    if (!arAccount) throw new Error("Chart of accounts missing AR (1210)");

    const paidAt = input.paidAt ?? new Date();
    const date = paidAt.toISOString().slice(0, 10);

    const [payCount] = await tx
      .select({ c: count() })
      .from(payments)
      .where(eq(payments.organizationId, input.organizationId));
    const payNum = (Number(payCount?.c ?? 0) + 1).toString().padStart(4, "0");
    const ym = date.slice(0, 7).replace("-", "");
    const paymentNumber = `PAY-R-${ym}-${payNum}`;

    const [payment] = await tx
      .insert(payments)
      .values({
        organizationId: input.organizationId,
        paymentNumber,
        paymentDate: date,
        paymentType: "received",
        entityType: "customer",
        entityId: link.customerId,
        bankAccountId,
        amount: String(amount),
        currency: link.currency || "AED",
        method: "card",
        reference:
          input.stripePaymentIntentId ||
          link.stripeCheckoutSessionId ||
          `plink:${link.id.slice(0, 8)}`,
        notes: `Payment link settlement for invoice`,
      })
      .returning();

    if (!payment) throw new Error("Failed to create payment");

    if (allocate > 0) {
      await tx.insert(paymentAllocations).values({
        paymentId: payment.id,
        documentType: "invoice",
        documentId: link.invoiceId,
        amount: String(allocate),
      });

      const paid = parseFloat(inv.amountPaid ?? "0") + allocate;
      const total = parseFloat(inv.total ?? "0");
      const credited = parseFloat(inv.creditApplied ?? "0");
      const newDue = Math.max(0, total - paid - credited);
      await tx
        .update(invoices)
        .set({
          amountPaid: String(paid),
          amountDue: String(newDue),
          status: newDue <= 0.01 ? "paid" : "partial",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, link.invoiceId));
    }

    await tx.insert(bankTransactions).values({
      organizationId: input.organizationId,
      bankAccountId,
      transactionDate: date,
      description: `Payment link — invoice settlement`,
      amount: String(amount),
      type: "credit",
      reference: paymentNumber,
      category: "customer_payment",
      paymentId: payment.id,
    });

    let journalEntryId: string | null = null;
    const periodId = await resolveOrCreatePeriod(input.organizationId, date, tx);
    if (periodId) {
      const [entryCountRow] = await tx
        .select({ c: count() })
        .from(journalEntries)
        .where(eq(journalEntries.organizationId, input.organizationId));
      const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;

      const [je] = await tx
        .insert(journalEntries)
        .values({
          organizationId: input.organizationId,
          periodId,
          entryNumber,
          entryDate: date,
          description: "Payment received — Payment link",
          reference: payment.id,
          sourceType: "payment_link",
          sourceId: link.id,
          status: "posted",
          currency: link.currency || "AED",
          totalDebit: String(amount),
          totalCredit: String(amount),
          postedAt: new Date(),
        })
        .returning();

      if (je) {
        journalEntryId = je.id;
        const lines: (typeof journalLines.$inferInsert)[] = [
          {
            journalEntryId: je.id,
            organizationId: input.organizationId,
            accountId: cashAccountId,
            description: "Payment link received",
            debit: String(amount),
            credit: "0",
            currency: link.currency || "AED",
            baseCurrencyDebit: String(amount),
            baseCurrencyCredit: "0",
            lineOrder: 1,
          },
        ];
        if (allocate > 0) {
          lines.push({
            journalEntryId: je.id,
            organizationId: input.organizationId,
            accountId: arAccount.id,
            description: "AR — payment link settlement",
            debit: "0",
            credit: String(allocate),
            currency: link.currency || "AED",
            baseCurrencyDebit: "0",
            baseCurrencyCredit: String(allocate),
            lineOrder: 2,
          });
        }
        if (unapplied > 0) {
          const [depositAcct] = await tx
            .select({ id: chartOfAccounts.id })
            .from(chartOfAccounts)
            .where(
              and(
                eq(chartOfAccounts.organizationId, input.organizationId),
                eq(chartOfAccounts.code, "2300")
              )
            )
            .limit(1);
          if (!depositAcct) {
            throw new Error(
              "Customer Deposits account (2300) not found. Please add it to your Chart of Accounts."
            );
          }
          lines.push({
            journalEntryId: je.id,
            organizationId: input.organizationId,
            accountId: depositAcct.id,
            description: "Customer deposit — unapplied payment link",
            debit: "0",
            credit: String(unapplied),
            currency: link.currency || "AED",
            baseCurrencyDebit: "0",
            baseCurrencyCredit: String(unapplied),
            lineOrder: lines.length + 1,
          });
        }
        await tx.insert(journalLines).values(lines);
        await tx
          .update(payments)
          .set({ journalEntryId: je.id })
          .where(eq(payments.id, payment.id));
      }
    }

    const [acc] = await tx
      .select({ currentBalance: bankAccounts.currentBalance })
      .from(bankAccounts)
      .where(eq(bankAccounts.id, bankAccountId))
      .limit(1);
    if (acc) {
      const bal = parseFloat(acc.currentBalance ?? "0") + amount;
      await tx
        .update(bankAccounts)
        .set({ currentBalance: String(bal) })
        .where(eq(bankAccounts.id, bankAccountId));
    }

    await tx
      .update(invoicePaymentLinks)
      .set({
        status: "paid",
        providerEventId: input.providerEventId,
        stripePaymentIntentId:
          input.stripePaymentIntentId ?? link.stripePaymentIntentId,
        paymentId: payment.id,
        journalEntryId,
        bankAccountId,
        paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoicePaymentLinks.id, link.id));

    return {
      paymentLinkId: link.id,
      paymentId: payment.id,
      journalEntryId,
      alreadySettled: false,
      status: "paid",
    };
  });
}
