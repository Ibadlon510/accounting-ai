import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { payRuns, salaryRecords } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

function mapPayRun(row: typeof payRuns.$inferSelect) {
  return {
    id: row.id,
    runNumber: row.runNumber,
    periodYear: row.periodYear,
    periodMonth: row.periodMonth,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    entryDate: row.entryDate,
    status: row.status,
    payFrom: row.payFrom,
    currency: row.currency,
    employeeCount: row.employeeCount,
    totalBasic: parseFloat(row.totalBasic ?? "0"),
    totalHousing: parseFloat(row.totalHousing ?? "0"),
    totalTransport: parseFloat(row.totalTransport ?? "0"),
    totalGross: parseFloat(row.totalGross ?? "0"),
    journalEntryId: row.journalEntryId,
    notes: row.notes,
    employerUniqueId: row.employerUniqueId,
    wpsGeneratedAt: row.wpsGeneratedAt?.toISOString?.() ?? null,
    postedAt: row.postedAt?.toISOString?.() ?? null,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
  };
}

export async function GET(_request: Request, { params }: Params) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const [run] = await db
      .select()
      .from(payRuns)
      .where(and(eq(payRuns.id, id), eq(payRuns.organizationId, orgId)))
      .limit(1);

    if (!run) return NextResponse.json({ error: "Pay run not found" }, { status: 404 });

    const records = await db
      .select()
      .from(salaryRecords)
      .where(and(eq(salaryRecords.payRunId, id), eq(salaryRecords.organizationId, orgId)));

    return NextResponse.json({
      payRun: mapPayRun(run),
      salaryRecords: records.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        basicSalary: parseFloat(r.basicSalary ?? "0"),
        housingAllowance: parseFloat(r.housingAllowance ?? "0"),
        transportAllowance: parseFloat(r.transportAllowance ?? "0"),
        variablePay: parseFloat(r.variablePay ?? "0"),
        totalGross: parseFloat(r.totalGross ?? "0"),
        daysInPeriod: r.daysInPeriod,
        daysUnpaidLeave: r.daysUnpaidLeave,
        labourCardNumber: r.labourCardNumber,
        iban: r.iban,
        bankRoutingCode: r.bankRoutingCode,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load pay run";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
