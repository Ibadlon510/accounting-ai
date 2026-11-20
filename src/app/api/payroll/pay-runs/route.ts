import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  employees,
  journalEntries,
  organizations,
  payRuns,
  salaryRecords,
} from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireWritableOrg, canCreateJournalEntry } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { postJournalEntry } from "@/lib/accounting/post-journal-entry";
import { periodBounds } from "@/lib/payroll/wps";
import { missingCodes, resolveAccountsByCode } from "@/lib/payroll/accounts";

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

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(payRuns)
      .where(eq(payRuns.organizationId, orgId))
      .orderBy(desc(payRuns.periodYear), desc(payRuns.periodMonth));

    return NextResponse.json({ payRuns: rows.map(mapPayRun) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load pay runs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type CreateBody = {
  periodYear: number;
  periodMonth: number;
  entryDate?: string;
  payFrom?: "cash" | "payable";
  notes?: string;
  employerUniqueId?: string;
  /** When true (default), post salary JE immediately and mark posted */
  post?: boolean;
};

/**
 * Create a period pay run for all active employees and post one consolidated salary JE.
 *
 * JE (UAE CoA):
 *   Dr 6010 Basic Salaries (sum)
 *   Dr 6020 Housing Allowance (sum, if > 0)
 *   Dr 6030 Transport Allowance (sum, if > 0)
 *   Cr 1110 Main Bank (payFrom=cash) OR 2110 Accrued Salaries (payable)
 *
 * sourceType = pay_run, immutable (reverse-only).
 */
export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const year = Number(body.periodYear);
  const month = Number(body.periodMonth);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "periodYear is required" }, { status: 400 });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "periodMonth must be 1–12" }, { status: 400 });
  }

  const shouldPost = body.post !== false;
  if (shouldPost) {
    const jeGate = await canCreateJournalEntry(orgId);
    if (!jeGate.allowed) {
      return NextResponse.json({ error: jeGate.reason }, { status: 403 });
    }
  }

  const { start, end, days } = periodBounds(year, month);
  const entryDate =
    typeof body.entryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.entryDate)
      ? body.entryDate
      : end;
  const payFrom = body.payFrom === "cash" ? "cash" : "payable";

  try {
    const [existing] = await db
      .select({ id: payRuns.id })
      .from(payRuns)
      .where(
        and(
          eq(payRuns.organizationId, orgId),
          eq(payRuns.periodYear, year),
          eq(payRuns.periodMonth, month)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `A pay run already exists for ${year}-${String(month).padStart(2, "0")}` },
        { status: 409 }
      );
    }

    const activeEmployees = await db
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, orgId), eq(employees.isActive, true)))
      .orderBy(sql`${employees.name} asc`);

    if (activeEmployees.length === 0) {
      return NextResponse.json(
        { error: "No active employees to include in the pay run" },
        { status: 400 }
      );
    }

    const lines = activeEmployees.map((emp) => {
      const basic = parseFloat(emp.basicSalary ?? "0") || 0;
      const housing = parseFloat(emp.housingAllowance ?? "0") || 0;
      const transport = parseFloat(emp.transportAllowance ?? "0") || 0;
      const total = Math.round((basic + housing + transport) * 100) / 100;
      return {
        emp,
        basic,
        housing,
        transport,
        total,
      };
    }).filter((l) => l.total > 0);

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Active employees have zero salary components" },
        { status: 400 }
      );
    }

    const totalBasic = round2(lines.reduce((s, l) => s + l.basic, 0));
    const totalHousing = round2(lines.reduce((s, l) => s + l.housing, 0));
    const totalTransport = round2(lines.reduce((s, l) => s + l.transport, 0));
    const totalGross = round2(totalBasic + totalHousing + totalTransport);

    const [org] = await db
      .select({
        taxRegistrationNumber: organizations.taxRegistrationNumber,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const employerUniqueId =
      (typeof body.employerUniqueId === "string" && body.employerUniqueId.trim()) ||
      org?.taxRegistrationNumber ||
      orgId.slice(0, 14).toUpperCase();

    const [{ c: runCount }] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(payRuns)
      .where(eq(payRuns.organizationId, orgId));
    const runNumber = `PR-${year}${String(month).padStart(2, "0")}-${String((runCount ?? 0) + 1).padStart(3, "0")}`;

    let journalEntryId: string | null = null;
    let entryNumber: string | null = null;

    if (shouldPost) {
      const creditCode = payFrom === "cash" ? "1110" : "2110";
      const needed = [creditCode];
      if (totalBasic > 0) needed.push("6010");
      if (totalHousing > 0) needed.push("6020");
      if (totalTransport > 0) needed.push("6030");
      if (needed.length < 2) {
        // Should not happen after totalGross > 0 filter
        needed.push("6000");
      }

      const byCode = await resolveAccountsByCode(orgId, needed);
      const missing = missingCodes(byCode, needed);
      if (missing.length) {
        return NextResponse.json(
          {
            error: `Chart of accounts missing code(s) ${missing.join(", ")}. Re-seed UAE CoA for this organization.`,
          },
          { status: 400 }
        );
      }

      const jeLines: {
        accountId: string;
        description?: string;
        debit: number;
        credit: number;
      }[] = [];
      if (totalBasic > 0) {
        jeLines.push({
          accountId: byCode.get("6010")!.id,
          description: `Basic salaries — ${runNumber}`,
          debit: totalBasic,
          credit: 0,
        });
      }
      if (totalHousing > 0) {
        jeLines.push({
          accountId: byCode.get("6020")!.id,
          description: `Housing allowance — ${runNumber}`,
          debit: totalHousing,
          credit: 0,
        });
      }
      if (totalTransport > 0) {
        jeLines.push({
          accountId: byCode.get("6030")!.id,
          description: `Transport allowance — ${runNumber}`,
          debit: totalTransport,
          credit: 0,
        });
      }
      jeLines.push({
        accountId: byCode.get(creditCode)!.id,
        description:
          payFrom === "cash"
            ? `Bank salary payment — ${runNumber}`
            : `Accrued salaries — ${runNumber}`,
        debit: 0,
        credit: totalGross,
      });

      const posted = await postJournalEntry({
        organizationId: orgId,
        entryDate,
        description: `Payroll ${year}-${String(month).padStart(2, "0")} (${lines.length} employees)`,
        reference: runNumber,
        sourceType: "pay_run",
        sourceId: undefined,
        currency: "AED",
        lines: jeLines,
        postedBy: roleCheck.userId,
      });
      journalEntryId = posted.journalEntryId;
      entryNumber = posted.entryNumber;
    }

    const result = await db.transaction(async (tx) => {
      const [run] = await tx
        .insert(payRuns)
        .values({
          organizationId: orgId,
          runNumber,
          periodYear: year,
          periodMonth: month,
          periodStart: start,
          periodEnd: end,
          entryDate,
          status: shouldPost ? "posted" : "draft",
          payFrom,
          currency: "AED",
          employeeCount: lines.length,
          totalBasic: String(totalBasic),
          totalHousing: String(totalHousing),
          totalTransport: String(totalTransport),
          totalGross: String(totalGross),
          journalEntryId,
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          employerUniqueId,
          createdBy: roleCheck.userId,
          postedBy: shouldPost ? roleCheck.userId : null,
          postedAt: shouldPost ? new Date() : null,
        })
        .returning();

      if (!run) throw new Error("Failed to create pay run");

      // Backfill sourceId on JE if we posted first
      if (journalEntryId) {
        await tx
          .update(journalEntries)
          .set({ sourceId: run.id })
          .where(eq(journalEntries.id, journalEntryId));
      }

      await tx.insert(salaryRecords).values(
        lines.map((l) => ({
          organizationId: orgId,
          payRunId: run.id,
          employeeId: l.emp.id,
          periodYear: year,
          periodMonth: month,
          periodStart: start,
          periodEnd: end,
          basicSalary: String(l.basic),
          housingAllowance: String(l.housing),
          transportAllowance: String(l.transport),
          variablePay: "0",
          totalGross: String(l.total),
          daysInPeriod: days,
          daysUnpaidLeave: 0,
          labourCardNumber: l.emp.labourCardNumber,
          iban: l.emp.iban,
          bankRoutingCode: l.emp.bankRoutingCode,
          employeeName: l.emp.name,
          journalEntryId,
        }))
      );

      return run;
    });

    return NextResponse.json({
      payRun: mapPayRun(result),
      entryNumber,
      journalEntryId,
    });
  } catch (e: unknown) {
    console.error("[payroll/pay-runs POST]", e);
    const msg = e instanceof Error ? e.message : "Failed to create pay run";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
