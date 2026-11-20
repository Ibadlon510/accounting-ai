/**
 * Best-effort UAE WPS Salary Information File (SIF) generator.
 *
 * Format used in practice by many UAE banks / payroll processors (CSV-style SIF):
 *
 * SCR,<EmployerUniqueID>,<FileCreationDate YYYYMMDD>,<FileCreationTime HHMMSS>,
 *     <SalaryMonth YYYY-MM>,<EDRCount>,<TotalSalary>,AED,<EmployerReference>
 * EDR,<EmployeeUniqueID>,<RoutingCode>,<EmployeeIBAN>,
 *     <PayStartDate YYYYMMDD>,<PayEndDate YYYYMMDD>,<DaysInPeriod>,
 *     <FixedIncome>,<VariableIncome>,<DaysOnLeaveWithoutPay>
 *
 * Notes:
 * - Not a certified MOL schema dump; banks may require slight field tweaks.
 * - EmployerUniqueID typically = MOL establishment ID (we accept override / tax TRN fallback).
 * - EmployeeUniqueID = labour card / person code (fallback employee number / id).
 * - Amounts in AED with 2 decimal places; no currency symbol.
 */

export type WpsEmployeeRow = {
  employeeUniqueId: string;
  routingCode: string;
  iban: string;
  payStart: string; // YYYY-MM-DD
  payEnd: string; // YYYY-MM-DD
  daysInPeriod: number;
  fixedIncome: number;
  variableIncome: number;
  daysUnpaidLeave: number;
};

export type WpsFileInput = {
  employerUniqueId: string;
  salaryMonth: string; // YYYY-MM
  employerReference: string;
  createdAt?: Date;
  employees: WpsEmployeeRow[];
};

function yyyymmdd(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function money(n: number): string {
  return (Math.round((n || 0) * 100) / 100).toFixed(2);
}

export function buildWpsSif(input: WpsFileInput): {
  content: string;
  filename: string;
  edrCount: number;
  totalSalary: number;
} {
  const now = input.createdAt ?? new Date();
  const fileDate = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}`;
  const fileTime = `${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}`;

  const edrCount = input.employees.length;
  const totalSalary = input.employees.reduce(
    (s, e) => s + (e.fixedIncome || 0) + (e.variableIncome || 0),
    0
  );

  const employerId = (input.employerUniqueId || "UNKNOWN").replace(/,/g, "");
  const employerRef = (input.employerReference || "PAYROLL").replace(/,/g, "");

  const lines: string[] = [
    [
      "SCR",
      employerId,
      fileDate,
      fileTime,
      input.salaryMonth,
      String(edrCount),
      money(totalSalary),
      "AED",
      employerRef,
    ].join(","),
  ];

  for (const e of input.employees) {
    lines.push(
      [
        "EDR",
        (e.employeeUniqueId || "").replace(/,/g, ""),
        (e.routingCode || "").replace(/,/g, ""),
        (e.iban || "").replace(/\s+/g, "").replace(/,/g, ""),
        yyyymmdd(e.payStart),
        yyyymmdd(e.payEnd),
        String(e.daysInPeriod || 0),
        money(e.fixedIncome),
        money(e.variableIncome),
        String(e.daysUnpaidLeave || 0),
      ].join(",")
    );
  }

  const content = lines.join("\n") + "\n";
  const filename = `WPS_${employerId}_${input.salaryMonth.replace("-", "")}.sif`;

  return { content, filename, edrCount, totalSalary: Math.round(totalSalary * 100) / 100 };
}

/** Days in calendar month (UTC). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function periodBounds(year: number, month: number): { start: string; end: string; days: number } {
  const days = daysInMonth(year, month);
  const start = `${year}-${pad2(month)}-01`;
  const end = `${year}-${pad2(month)}-${pad2(days)}`;
  return { start, end, days };
}
