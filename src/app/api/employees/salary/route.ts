import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { employees, journalEntries, journalLines, chartOfAccounts, salaryRecords } from "@/lib/db/schema";
import { and, eq, count, inArray } from "drizzle-orm";
import { requireWritableOrg, canCreateJournalEntry } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { resolveOrCreatePeriod } from "@/lib/banking/period";

/**
 * Foundation salary posting (not full WPS / pay runs).
 *
 * Debits (UAE CoA):
 *   6010 Basic Salaries
 *   6020 Housing Allowance  (if > 0)
 *   6030 Transport Allowance (if > 0)
 *   — or 6000 Salaries & Wages when a single override amount is provided
 *
 * Credits:
 *   1110 Main Bank Account (AED) when payFrom = "cash"
 *   2110 Accrued Salaries when payFrom = "payable"
 */

type SalaryBody = {
  employeeId: string;
  entryDate: string;
  description?: string;
  reference?: string;
  /** Override component amounts; defaults to employee record */
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  /** Single total override — posts to 6000 instead of component accounts */
  amount?: number;
  /** cash → Cr 1110; payable → Cr 2110 */
  payFrom?: "cash" | "payable";
};

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const jeGate = await canCreateJournalEntry(orgId);
  if (!jeGate.allowed) {
    return NextResponse.json({ error: jeGate.reason }, { status: 403 });
  }

  let body: SalaryBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const employeeId = typeof body.employeeId === "string" ? body.employeeId : "";
  const entryDate = typeof body.entryDate === "string" ? body.entryDate.trim() : "";
  if (!employeeId) return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  if (!entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return NextResponse.json({ error: "entryDate must be YYYY-MM-DD" }, { status: 400 });
  }

  const payFrom = body.payFrom === "payable" ? "payable" : "cash";

  try {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.organizationId, orgId)))
      .limit(1);

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    if (!employee.isActive) {
      return NextResponse.json({ error: "Cannot post salary for an inactive employee" }, { status: 400 });
    }

    const useOverrideTotal =
      typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount > 0;

    let debitLines: { code: string; amount: number; label: string }[];

    if (useOverrideTotal) {
      debitLines = [{ code: "6000", amount: Number(body.amount), label: "Salaries & Wages" }];
    } else {
      const basic =
        typeof body.basicSalary === "number" && Number.isFinite(body.basicSalary)
          ? body.basicSalary
          : parseFloat(employee.basicSalary ?? "0");
      const housing =
        typeof body.housingAllowance === "number" && Number.isFinite(body.housingAllowance)
          ? body.housingAllowance
          : parseFloat(employee.housingAllowance ?? "0");
      const transport =
        typeof body.transportAllowance === "number" && Number.isFinite(body.transportAllowance)
          ? body.transportAllowance
          : parseFloat(employee.transportAllowance ?? "0");

      debitLines = [];
      if (basic > 0) debitLines.push({ code: "6010", amount: basic, label: "Basic Salaries" });
      if (housing > 0) debitLines.push({ code: "6020", amount: housing, label: "Housing Allowance" });
      if (transport > 0) debitLines.push({ code: "6030", amount: transport, label: "Transport Allowance" });
    }

    const total = debitLines.reduce((s, l) => s + l.amount, 0);
    if (total <= 0) {
      return NextResponse.json(
        { error: "Salary amount must be greater than zero. Set basic salary or pass amount." },
        { status: 400 }
      );
    }

    const creditCode = payFrom === "payable" ? "2110" : "1110";
    const neededCodes = [...new Set([...debitLines.map((l) => l.code), creditCode])];

    const accounts = await db
      .select({ id: chartOfAccounts.id, code: chartOfAccounts.code, name: chartOfAccounts.name })
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.organizationId, orgId), inArray(chartOfAccounts.code, neededCodes)));

    const byCode = new Map(accounts.map((a) => [a.code, a]));
    for (const code of neededCodes) {
      if (!byCode.has(code)) {
        return NextResponse.json(
          { error: `Chart of accounts missing code ${code}. Re-seed UAE CoA for this organization.` },
          { status: 400 }
        );
      }
    }

    const description =
      (typeof body.description === "string" && body.description.trim()) ||
      `Salary — ${employee.name}${employee.employeeNumber ? ` (${employee.employeeNumber})` : ""}`;
    const reference =
      (typeof body.reference === "string" && body.reference.trim()) ||
      `SAL-${employee.employeeNumber || employee.id.slice(0, 8)}-${entryDate.slice(0, 7)}`;

    const result = await db.transaction(async (tx) => {
      const periodId = await resolveOrCreatePeriod(orgId, entryDate, tx);
      if (!periodId) throw new Error("Could not resolve accounting period for date");

      const [entryCountRow] = await tx
        .select({ c: count() })
        .from(journalEntries)
        .where(eq(journalEntries.organizationId, orgId));
      const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const entryNumber = `JE-${entryDate.slice(0, 7).replace("-", "")}-${seq}`;

      const [entry] = await tx
        .insert(journalEntries)
        .values({
          organizationId: orgId,
          periodId,
          entryNumber,
          entryDate,
          description,
          reference,
          sourceType: "salary",
          sourceId: employee.id,
          status: "posted",
          currency: "AED",
          totalDebit: String(total),
          totalCredit: String(total),
          postedAt: new Date(),
        })
        .returning({
          id: journalEntries.id,
          entryNumber: journalEntries.entryNumber,
          entryDate: journalEntries.entryDate,
          description: journalEntries.description,
          reference: journalEntries.reference,
          status: journalEntries.status,
          totalDebit: journalEntries.totalDebit,
          totalCredit: journalEntries.totalCredit,
          postedAt: journalEntries.postedAt,
          createdAt: journalEntries.createdAt,
        });

      if (!entry) throw new Error("Failed to create journal entry");

      const lines: {
        accountId: string;
        accountCode: string;
        accountName: string;
        description: string;
        debit: number;
        credit: number;
        lineOrder: number;
      }[] = [];

      let order = 1;
      for (const dl of debitLines) {
        const acct = byCode.get(dl.code)!;
        await tx.insert(journalLines).values({
          journalEntryId: entry.id,
          organizationId: orgId,
          accountId: acct.id,
          description: `${dl.label} — ${employee.name}`,
          debit: String(dl.amount),
          credit: "0",
          currency: "AED",
          baseCurrencyDebit: String(dl.amount),
          baseCurrencyCredit: "0",
          lineOrder: order,
        });
        lines.push({
          accountId: acct.id,
          accountCode: acct.code,
          accountName: acct.name,
          description: `${dl.label} — ${employee.name}`,
          debit: dl.amount,
          credit: 0,
          lineOrder: order,
        });
        order += 1;
      }

      const creditAcct = byCode.get(creditCode)!;
      const creditLabel = payFrom === "payable" ? "Accrued Salaries" : "Bank payment";
      await tx.insert(journalLines).values({
        journalEntryId: entry.id,
        organizationId: orgId,
        accountId: creditAcct.id,
        description: `${creditLabel} — ${employee.name}`,
        debit: "0",
        credit: String(total),
        currency: "AED",
        baseCurrencyDebit: "0",
        baseCurrencyCredit: String(total),
        lineOrder: order,
      });
      lines.push({
        accountId: creditAcct.id,
        accountCode: creditAcct.code,
        accountName: creditAcct.name,
        description: `${creditLabel} — ${employee.name}`,
        debit: 0,
        credit: total,
        lineOrder: order,
      });

      const periodYear = Number(entryDate.slice(0, 4));
      const periodMonth = Number(entryDate.slice(5, 7));
      const basicAmt = useOverrideTotal
        ? total
        : debitLines.find((d) => d.code === "6010")?.amount ?? 0;
      const housingAmt = useOverrideTotal
        ? 0
        : debitLines.find((d) => d.code === "6020")?.amount ?? 0;
      const transportAmt = useOverrideTotal
        ? 0
        : debitLines.find((d) => d.code === "6030")?.amount ?? 0;

      await tx.insert(salaryRecords).values({
        organizationId: orgId,
        payRunId: null,
        employeeId: employee.id,
        periodYear,
        periodMonth,
        periodStart: entryDate,
        periodEnd: entryDate,
        basicSalary: String(basicAmt),
        housingAllowance: String(housingAmt),
        transportAllowance: String(transportAmt),
        variablePay: "0",
        totalGross: String(total),
        daysInPeriod: 30,
        daysUnpaidLeave: 0,
        labourCardNumber: employee.labourCardNumber,
        iban: employee.iban,
        bankRoutingCode: employee.bankRoutingCode,
        employeeName: employee.name,
        journalEntryId: entry.id,
      });

      return { entry, lines };
    });

    return NextResponse.json({
      entry: {
        id: result.entry.id,
        entryNumber: result.entry.entryNumber,
        entryDate: result.entry.entryDate,
        description: result.entry.description,
        reference: result.entry.reference ?? undefined,
        status: result.entry.status,
        sourceType: "salary",
        sourceId: employee.id,
        totalDebit: parseFloat(result.entry.totalDebit ?? "0"),
        totalCredit: parseFloat(result.entry.totalCredit ?? "0"),
        postedAt: result.entry.postedAt?.toISOString(),
        createdAt: result.entry.createdAt?.toISOString(),
        lines: result.lines,
        payFrom,
        employee: {
          id: employee.id,
          name: employee.name,
          employeeNumber: employee.employeeNumber,
        },
      },
    });
  } catch (e: unknown) {
    console.error("[employees/salary POST] Error:", e);
    const msg = e instanceof Error ? e.message : "Failed to post salary journal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
