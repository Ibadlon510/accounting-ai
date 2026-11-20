import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { organizations, payRuns, salaryRecords } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireWritableOrg } from "@/lib/billing/gates";
import { buildWpsSif } from "@/lib/payroll/wps";

type Params = { params: Promise<{ id: string }> };

/**
 * Generate downloadable WPS SIF for a posted pay run.
 * Marks wps_generated_at (write gated for ARCHIVE orgs).
 */
export async function GET(request: Request, { params }: Params) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const { id } = await params;
  const url = new URL(request.url);
  const download = url.searchParams.get("download") !== "0";

  try {
    const [run] = await db
      .select()
      .from(payRuns)
      .where(and(eq(payRuns.id, id), eq(payRuns.organizationId, orgId)))
      .limit(1);

    if (!run) return NextResponse.json({ error: "Pay run not found" }, { status: 404 });
    if (run.status !== "posted") {
      return NextResponse.json({ error: "WPS export requires a posted pay run" }, { status: 400 });
    }

    const records = await db
      .select()
      .from(salaryRecords)
      .where(and(eq(salaryRecords.payRunId, id), eq(salaryRecords.organizationId, orgId)));

    if (records.length === 0) {
      return NextResponse.json({ error: "Pay run has no salary records" }, { status: 400 });
    }

    const [org] = await db
      .select({ taxRegistrationNumber: organizations.taxRegistrationNumber })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const employerUniqueId =
      run.employerUniqueId ||
      org?.taxRegistrationNumber ||
      orgId.slice(0, 14).toUpperCase();

    const salaryMonth = `${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`;
    const periodStart = run.periodStart;
    const periodEnd = run.periodEnd;

    const sif = buildWpsSif({
      employerUniqueId,
      salaryMonth,
      employerReference: run.runNumber,
      employees: records.map((r) => {
        const fixed =
          parseFloat(r.basicSalary ?? "0") +
          parseFloat(r.housingAllowance ?? "0") +
          parseFloat(r.transportAllowance ?? "0");
        const variable = parseFloat(r.variablePay ?? "0");
        return {
          employeeUniqueId:
            r.labourCardNumber ||
            // fall back to employee id fragment — banks will reject; UI warns
            r.employeeId.slice(0, 14),
          routingCode: r.bankRoutingCode || "000000000",
          iban: r.iban || "",
          payStart: periodStart,
          payEnd: periodEnd,
          daysInPeriod: r.daysInPeriod ?? 30,
          fixedIncome: fixed,
          variableIncome: variable,
          daysUnpaidLeave: r.daysUnpaidLeave ?? 0,
        };
      }),
    });

    await db
      .update(payRuns)
      .set({ wpsGeneratedAt: new Date(), updatedAt: new Date() })
      .where(eq(payRuns.id, id));

    if (!download) {
      return NextResponse.json({
        filename: sif.filename,
        edrCount: sif.edrCount,
        totalSalary: sif.totalSalary,
        preview: sif.content.split("\n").slice(0, 5),
      });
    }

    return new NextResponse(sif.content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sif.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    console.error("[payroll/wps GET]", e);
    const msg = e instanceof Error ? e.message : "Failed to generate WPS file";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
