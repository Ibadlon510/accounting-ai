import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documentTransactions, invoices, bills } from "@/lib/db/schema";
import { eq, and, gte, lte, sum } from "drizzle-orm";

const QUARTER_MAP: Record<string, { start: string; end: string }> = {
  "Q1-2025": { start: "2025-01-01", end: "2025-03-31" },
  "Q2-2025": { start: "2025-04-01", end: "2025-06-30" },
  "Q3-2025": { start: "2025-07-01", end: "2025-09-30" },
  "Q4-2025": { start: "2025-10-01", end: "2025-12-31" },
  "Q1-2026": { start: "2026-01-01", end: "2026-03-31" },
  "Q2-2026": { start: "2026-04-01", end: "2026-06-30" },
  "Q3-2026": { start: "2026-07-01", end: "2026-09-30" },
  "Q4-2026": { start: "2026-10-01", end: "2026-12-31" },
};

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const quarter = searchParams.get("quarter") ?? "Q1-2026";
  const range = QUARTER_MAP[quarter];
  if (!range) {
    return NextResponse.json({ error: "Invalid quarter. Use e.g. Q3-2025" }, { status: 400 });
  }

  const startDate = range.start;
  const endDate = range.end;

  const [docTx] = await db
    .select({
      inputVat: sum(documentTransactions.vatAmount),
      taxablePurchases: sum(documentTransactions.netAmount),
    })
    .from(documentTransactions)
    .where(
      and(
        eq(documentTransactions.organizationId, orgId),
        gte(documentTransactions.date, startDate),
        lte(documentTransactions.date, endDate)
      )
  );

  const [inv] = await db
    .select({
      outputVat: sum(invoices.taxAmount),
      taxableSales: sum(invoices.subtotal),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, orgId),
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate)
      )
    );

  const [billRow] = await db
    .select({
      inputVat: sum(bills.taxAmount),
      taxablePurchases: sum(bills.subtotal),
    })
    .from(bills)
    .where(
      and(
        eq(bills.organizationId, orgId),
        gte(bills.issueDate, startDate),
        lte(bills.issueDate, endDate)
      )
    );

  const outputVat = Number(inv?.outputVat ?? 0);
  const taxableSales = Number(inv?.taxableSales ?? 0);
  const inputVatDoc = Number(docTx?.inputVat ?? 0);
  const inputVatBills = Number(billRow?.inputVat ?? 0);
  const taxablePurchasesDoc = Number(docTx?.taxablePurchases ?? 0);
  const taxablePurchasesBills = Number(billRow?.taxablePurchases ?? 0);

  const totalOutputVat = outputVat;
  const totalInputVat = inputVatDoc + inputVatBills;
  const netVat = totalOutputVat - totalInputVat;

  const report = {
    quarter,
    periodStart: startDate,
    periodEnd: endDate,
    box1a_taxable_sales: taxableSales,
    box1b_output_vat: totalOutputVat,
    box8_taxable_purchases: taxablePurchasesDoc + taxablePurchasesBills,
    box9_input_vat: totalInputVat,
    box15_net_vat_payable: netVat,
    taxableSales,
    outputVat: totalOutputVat,
    taxablePurchases: taxablePurchasesDoc + taxablePurchasesBills,
    inputVat: totalInputVat,
    netVat,
    zeroRatedSales: 0,
    exemptSales: 0,
  };

  return NextResponse.json(report);
}
