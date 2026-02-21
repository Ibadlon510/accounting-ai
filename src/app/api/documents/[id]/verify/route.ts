import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  documents,
  documentTransactions,
  merchantMaps,
  chartOfAccounts,
  journalEntries,
  journalLines,
  accountingPeriods,
  fiscalYears,
} from "@/lib/db/schema";
import { eq, and, lte, gte, sql, count } from "drizzle-orm";
import { moveToRetentionVault, isVaultConfigured } from "@/lib/storage/vault";
import { auditLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

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

  let body: {
    date: string;
    totalAmount: number;
    vatAmount: number;
    netAmount: number;
    currency?: string;
    merchantName: string;
    glAccountId: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    date,
    totalAmount,
    vatAmount,
    netAmount,
    currency = "AED",
    merchantName,
    glAccountId,
  } = body;

  if (
    !date ||
    typeof totalAmount !== "number" ||
    typeof vatAmount !== "number" ||
    typeof netAmount !== "number" ||
    !merchantName?.trim() ||
    !glAccountId
  ) {
    return NextResponse.json(
      { error: "Missing or invalid: date, totalAmount, vatAmount, netAmount, merchantName, glAccountId" },
      { status: 400 }
    );
  }

  // Verify GL account belongs to org
  const [glAccount] = await db
    .select()
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.id, glAccountId),
        eq(chartOfAccounts.organizationId, orgId)
      )
    )
    .limit(1);
  if (!glAccount) {
    return NextResponse.json({ error: "Invalid GL account" }, { status: 400 });
  }

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

  const [txn] = await db.insert(documentTransactions).values({
    documentId,
    organizationId: orgId,
    date,
    totalAmount: String(totalAmount),
    vatAmount: String(vatAmount),
    netAmount: String(netAmount),
    currency,
    merchantName: merchantName.trim(),
    glAccountId,
  }).returning({ id: documentTransactions.id });

  // ─── Create Journal Entry ───────────────────────────────────
  const periodId = await resolveOrCreatePeriod(orgId, date);
  if (periodId) {
    const [entryCountRow] = await db
      .select({ c: count() })
      .from(journalEntries)
      .where(eq(journalEntries.organizationId, orgId));
    const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const ym = date.slice(0, 7).replace("-", "");
    const entryNumber = `JE-${ym}-${seq}`;

    const [je] = await db.insert(journalEntries).values({
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
    }).returning({ id: journalEntries.id });

    if (je) {
      const lines: (typeof journalLines.$inferInsert)[] = [];
      let lineOrder = 1;

      // Line 1: Debit expense account (net amount)
      lines.push({
        journalEntryId: je.id,
        organizationId: orgId,
        accountId: glAccountId,
        description: `${merchantName.trim()} — expense`,
        debit: String(netAmount),
        credit: "0",
        currency,
        baseCurrencyDebit: String(netAmount),
        baseCurrencyCredit: "0",
        lineOrder: lineOrder++,
      });

      // Line 2: Debit VAT input (if VAT > 0)
      if (vatAmount > 0) {
        const [vatInputAccount] = await db
          .select({ id: chartOfAccounts.id })
          .from(chartOfAccounts)
          .where(
            and(
              eq(chartOfAccounts.organizationId, orgId),
              eq(chartOfAccounts.code, "1450")
            )
          )
          .limit(1);

        if (vatInputAccount) {
          lines.push({
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

      // Line 3: Credit Accounts Payable (total amount)
      const [apAccount] = await db
        .select({ id: chartOfAccounts.id })
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.organizationId, orgId),
            eq(chartOfAccounts.code, "2010")
          )
        )
        .limit(1);

      if (apAccount) {
        lines.push({
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

      if (lines.length > 0) {
        await db.insert(journalLines).values(lines);
      }
    }
  }

  await db
    .insert(merchantMaps)
    .values({
      organizationId: orgId,
      merchantName: merchantName.trim().toUpperCase(),
      glAccountId,
      confidence: "1",
    })
    .onConflictDoUpdate({
      target: [merchantMaps.organizationId, merchantMaps.merchantName],
      set: { glAccountId, lastUsed: new Date(), confidence: "1" },
    });

  const session = await auth();
  const userId = session?.user?.id;

  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId,
    action: "document_verified",
    entity: "documents",
    entityId: documentId,
    metadata: { merchantName: merchantName.trim(), glAccountId },
  });

  return NextResponse.json({ ok: true });
}

// ─── Helper: resolve or auto-create accounting period for a date ──────
async function resolveOrCreatePeriod(
  orgId: string,
  txnDate: string
): Promise<string | null> {
  // Try to find an existing period that covers the date
  const [existing] = await db
    .select({ id: accountingPeriods.id })
    .from(accountingPeriods)
    .where(
      and(
        eq(accountingPeriods.organizationId, orgId),
        lte(accountingPeriods.startDate, txnDate),
        gte(accountingPeriods.endDate, txnDate)
      )
    )
    .limit(1);

  if (existing) return existing.id;

  // Auto-create fiscal year + period for the transaction month
  const d = new Date(txnDate);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed

  // Ensure fiscal year exists
  const fyStart = `${year}-01-01`;
  const fyEnd = `${year}-12-31`;
  const fyName = `FY ${year}`;

  let fyId: string;
  const [existingFy] = await db
    .select({ id: fiscalYears.id })
    .from(fiscalYears)
    .where(
      and(
        eq(fiscalYears.organizationId, orgId),
        eq(fiscalYears.name, fyName)
      )
    )
    .limit(1);

  if (existingFy) {
    fyId = existingFy.id;
  } else {
    const [newFy] = await db
      .insert(fiscalYears)
      .values({
        organizationId: orgId,
        name: fyName,
        startDate: fyStart,
        endDate: fyEnd,
      })
      .returning({ id: fiscalYears.id });
    if (!newFy) return null;
    fyId = newFy.id;
  }

  // Create the monthly period
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const periodName = `${monthNames[month]} ${year}`;

  const [newPeriod] = await db
    .insert(accountingPeriods)
    .values({
      organizationId: orgId,
      fiscalYearId: fyId,
      name: periodName,
      startDate: monthStart,
      endDate: monthEnd,
      status: "open",
    })
    .returning({ id: accountingPeriods.id });

  return newPeriod?.id ?? null;
}
