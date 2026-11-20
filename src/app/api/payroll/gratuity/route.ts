import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  employees,
  gratuityProvisionLines,
  gratuityProvisions,
  journalEntries,
} from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireWritableOrg, canCreateJournalEntry } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { postJournalEntry } from "@/lib/accounting/post-journal-entry";
import { calculateUaeGratuity } from "@/lib/payroll/gratuity";
import { missingCodes, resolveAccountsByCode } from "@/lib/payroll/accounts";

function mapProvision(row: typeof gratuityProvisions.$inferSelect) {
  return {
    id: row.id,
    provisionNumber: row.provisionNumber,
    asOfDate: row.asOfDate,
    entryDate: row.entryDate,
    status: row.status,
    currency: row.currency,
    employeeCount: row.employeeCount,
    totalLiability: parseFloat(row.totalLiability ?? "0"),
    totalIncrease: parseFloat(row.totalIncrease ?? "0"),
    journalEntryId: row.journalEntryId,
    notes: row.notes,
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
      .from(gratuityProvisions)
      .where(eq(gratuityProvisions.organizationId, orgId))
      .orderBy(desc(gratuityProvisions.asOfDate), desc(gratuityProvisions.createdAt));

    return NextResponse.json({ provisions: rows.map(mapProvision) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load gratuity provisions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type CreateBody = {
  asOfDate: string;
  entryDate?: string;
  notes?: string;
};

/**
 * Calculate UAE-style EOS liability for active employees and post provision JE
 * for the net increase vs prior provisions.
 *
 * JE: Dr 6040 End of Service Provision / Cr 2600 EOS Long-term
 * Fallback Cr 2300 if 2600 missing.
 * sourceType = gratuity_provision
 */
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

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const asOfDate = typeof body.asOfDate === "string" ? body.asOfDate.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
    return NextResponse.json({ error: "asOfDate must be YYYY-MM-DD" }, { status: 400 });
  }
  const entryDate =
    typeof body.entryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.entryDate)
      ? body.entryDate
      : asOfDate;

  try {
    const activeEmployees = await db
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, orgId), eq(employees.isActive, true)));

    if (activeEmployees.length === 0) {
      return NextResponse.json({ error: "No active employees" }, { status: 400 });
    }

    // Sum of increase amounts already posted per employee
    const prior = await db
      .select({
        employeeId: gratuityProvisionLines.employeeId,
        provisioned: sql<string>`coalesce(sum(${gratuityProvisionLines.increaseAmount}), 0)`,
      })
      .from(gratuityProvisionLines)
      .innerJoin(
        gratuityProvisions,
        eq(gratuityProvisionLines.provisionId, gratuityProvisions.id)
      )
      .where(
        and(
          eq(gratuityProvisionLines.organizationId, orgId),
          eq(gratuityProvisions.status, "posted")
        )
      )
      .groupBy(gratuityProvisionLines.employeeId);

    const priorByEmployee = new Map(
      prior.map((p) => [p.employeeId, parseFloat(p.provisioned ?? "0") || 0])
    );

    const calcLines: {
      employeeId: string;
      employeeName: string;
      joinDate: string | null;
      yearsOfService: number;
      basicSalary: number;
      dailyWage: number;
      cumulativeLiability: number;
      previouslyProvisioned: number;
      increaseAmount: number;
      calculationNotes: string;
    }[] = [];

    for (const emp of activeEmployees) {
      const basic = parseFloat(emp.basicSalary ?? "0") || 0;
      if (!emp.joinDate || basic <= 0) continue;

      const calc = calculateUaeGratuity({
        basicSalary: basic,
        joinDate: emp.joinDate,
        asOfDate,
      });
      const previouslyProvisioned = priorByEmployee.get(emp.id) ?? 0;
      const increase = Math.round((calc.cumulativeLiability - previouslyProvisioned) * 100) / 100;

      calcLines.push({
        employeeId: emp.id,
        employeeName: emp.name,
        joinDate: emp.joinDate,
        yearsOfService: calc.yearsOfService,
        basicSalary: basic,
        dailyWage: calc.dailyWage,
        cumulativeLiability: calc.cumulativeLiability,
        previouslyProvisioned,
        increaseAmount: increase,
        calculationNotes: calc.calculationNotes,
      });
    }

    const increases = calcLines.filter((l) => l.increaseAmount > 0);
    if (increases.length === 0) {
      return NextResponse.json(
        {
          error:
            "No provision increase to post. Liability may already be fully provisioned, or employees lack join date / basic salary.",
          preview: calcLines.map((l) => ({
            employeeName: l.employeeName,
            cumulativeLiability: l.cumulativeLiability,
            previouslyProvisioned: l.previouslyProvisioned,
            increaseAmount: l.increaseAmount,
          })),
        },
        { status: 400 }
      );
    }

    const totalLiability = round2(
      calcLines.reduce((s, l) => s + l.cumulativeLiability, 0)
    );
    const totalIncrease = round2(increases.reduce((s, l) => s + l.increaseAmount, 0));

    let creditCode = "2600";
    const byCode = await resolveAccountsByCode(orgId, ["6040", "2600", "2300"]);
    if (!byCode.has("6040")) {
      return NextResponse.json(
        { error: "Chart of accounts missing code 6040 (End of Service Provision)." },
        { status: 400 }
      );
    }
    if (!byCode.has("2600")) {
      if (!byCode.has("2300")) {
        return NextResponse.json(
          { error: "Chart of accounts missing EOS liability codes 2600 and 2300." },
          { status: 400 }
        );
      }
      creditCode = "2300";
    }

    const missing = missingCodes(byCode, ["6040", creditCode]);
    if (missing.length) {
      return NextResponse.json(
        { error: `Chart of accounts missing code(s) ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const [{ c: provCount }] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(gratuityProvisions)
      .where(eq(gratuityProvisions.organizationId, orgId));
    const provisionNumber = `EOS-${asOfDate.slice(0, 7).replace("-", "")}-${String((provCount ?? 0) + 1).padStart(3, "0")}`;

    const posted = await postJournalEntry({
      organizationId: orgId,
      entryDate,
      description: `EOS / gratuity provision as of ${asOfDate}`,
      reference: provisionNumber,
      sourceType: "gratuity_provision",
      currency: "AED",
      lines: [
        {
          accountId: byCode.get("6040")!.id,
          description: `End of service provision — ${provisionNumber}`,
          debit: totalIncrease,
          credit: 0,
        },
        {
          accountId: byCode.get(creditCode)!.id,
          description: `EOS liability — ${provisionNumber}`,
          debit: 0,
          credit: totalIncrease,
        },
      ],
      postedBy: roleCheck.userId,
    });

    const result = await db.transaction(async (tx) => {
      const [prov] = await tx
        .insert(gratuityProvisions)
        .values({
          organizationId: orgId,
          provisionNumber,
          asOfDate,
          entryDate,
          status: "posted",
          currency: "AED",
          employeeCount: calcLines.length,
          totalLiability: String(totalLiability),
          totalIncrease: String(totalIncrease),
          journalEntryId: posted.journalEntryId,
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          createdBy: roleCheck.userId,
          postedAt: new Date(),
        })
        .returning();

      if (!prov) throw new Error("Failed to create provision");

      await tx
        .update(journalEntries)
        .set({ sourceId: prov.id })
        .where(eq(journalEntries.id, posted.journalEntryId));

      // Store all calculated lines (including zero-increase) for audit
      await tx.insert(gratuityProvisionLines).values(
        calcLines.map((l) => ({
          organizationId: orgId,
          provisionId: prov.id,
          employeeId: l.employeeId,
          employeeName: l.employeeName,
          joinDate: l.joinDate,
          yearsOfService: String(l.yearsOfService),
          basicSalary: String(l.basicSalary),
          dailyWage: String(l.dailyWage),
          cumulativeLiability: String(l.cumulativeLiability),
          previouslyProvisioned: String(l.previouslyProvisioned),
          // Only the positive increase is what was journaled; store actual delta
          // (may be negative if liability fell — not posted in JE)
          increaseAmount: String(Math.max(0, l.increaseAmount)),
          calculationNotes: l.calculationNotes,
        }))
      );

      return prov;
    });

    return NextResponse.json({
      provision: mapProvision(result),
      entryNumber: posted.entryNumber,
      journalEntryId: posted.journalEntryId,
      creditAccount: creditCode,
      lines: calcLines,
    });
  } catch (e: unknown) {
    console.error("[payroll/gratuity POST]", e);
    const msg = e instanceof Error ? e.message : "Failed to post gratuity provision";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
