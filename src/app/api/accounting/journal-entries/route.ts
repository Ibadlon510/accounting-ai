import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { journalEntries, journalLines, chartOfAccounts } from "@/lib/db/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";
import { requireOrgRole } from "@/lib/auth/require-role";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));

  try {
    const [totalRow] = await db
      .select({ c: count() })
      .from(journalEntries)
      .where(eq(journalEntries.organizationId, orgId));
    const total = Number(totalRow?.c ?? 0);

    const rows = await db
      .select({
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
        sourceType: journalEntries.sourceType,
      })
      .from(journalEntries)
      .where(eq(journalEntries.organizationId, orgId))
      .orderBy(desc(journalEntries.entryDate), desc(journalEntries.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const entryIds = rows.map((r) => r.id);

    const allLines = entryIds.length > 0
      ? await db
          .select({
            id: journalLines.id,
            journalEntryId: journalLines.journalEntryId,
            accountId: journalLines.accountId,
            description: journalLines.description,
            debit: journalLines.debit,
            credit: journalLines.credit,
            lineOrder: journalLines.lineOrder,
            accountCode: chartOfAccounts.code,
            accountName: chartOfAccounts.name,
          })
          .from(journalLines)
          .leftJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
          .where(inArray(journalLines.journalEntryId, entryIds))
          .orderBy(journalLines.lineOrder)
      : [];

    const linesByEntryId = new Map<string, typeof allLines>();
    for (const line of allLines) {
      const group = linesByEntryId.get(line.journalEntryId) ?? [];
      group.push(line);
      linesByEntryId.set(line.journalEntryId, group);
    }

    const result = rows.map((je) => ({
      id: je.id,
      entryNumber: je.entryNumber,
      entryDate: je.entryDate,
      description: je.description,
      reference: je.reference ?? undefined,
      status: je.status,
      sourceType: je.sourceType ?? "manual",
      totalDebit: parseFloat(je.totalDebit ?? "0"),
      totalCredit: parseFloat(je.totalCredit ?? "0"),
      postedAt: je.postedAt?.toISOString(),
      createdAt: je.createdAt?.toISOString(),
      lines: (linesByEntryId.get(je.id) ?? []).map((l) => ({
        id: l.id,
        accountId: l.accountId,
        accountCode: l.accountCode ?? "",
        accountName: l.accountName ?? "",
        description: l.description ?? "",
        debit: parseFloat(l.debit ?? "0"),
        credit: parseFloat(l.credit ?? "0"),
        lineOrder: l.lineOrder,
      })),
    }));

    return NextResponse.json({ entries: result, total, page, limit });
  } catch (e: unknown) {
    console.error("[accounting/journal-entries GET] Error:", e);
    return NextResponse.json({ error: "Failed to load journal entries" }, { status: 500 });
  }
}

type LineInput = { accountId: string; description?: string; debit: number; credit: number };

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: { entryDate: string; description: string; reference?: string; lines: LineInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { entryDate, description, reference, lines } = body;
  if (!entryDate || !description?.trim()) return NextResponse.json({ error: "Entry date and description are required" }, { status: 400 });
  if (!lines?.length || lines.length < 2) return NextResponse.json({ error: "At least 2 lines are required" }, { status: 400 });

  const validLines = lines
    .map((l) => ({
      accountId: l.accountId,
      description: (l.description ?? "").trim(),
      debit: Math.max(0, Number(l.debit) || 0),
      credit: Math.max(0, Number(l.credit) || 0),
    }))
    .filter((l) => l.accountId && (l.debit > 0 || l.credit > 0));

  if (validLines.length < 2) return NextResponse.json({ error: "At least 2 valid lines (with account, debit or credit) are required" }, { status: 400 });

  const totalDebit = validLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = validLines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) return NextResponse.json({ error: "Entry must balance (total debits = total credits)" }, { status: 400 });

  try {
    const { je, acctMap } = await db.transaction(async (tx) => {
      const periodId = await resolveOrCreatePeriod(orgId, entryDate, tx);
      if (!periodId) throw new Error("Could not resolve accounting period for date");

      const [entryCountRow] = await tx.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
      const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const entryNumber = `JE-${entryDate.slice(0, 7).replace("-", "")}-${seq}`;

      const [entry] = await tx
        .insert(journalEntries)
        .values({
          organizationId: orgId,
          periodId,
          entryNumber,
          entryDate,
          description: description.trim(),
          reference: reference?.trim() || null,
          sourceType: "manual",
          status: "posted",
          currency: "AED",
          totalDebit: String(totalDebit),
          totalCredit: String(totalCredit),
          postedAt: new Date(),
        })
        .returning({ id: journalEntries.id, entryNumber: journalEntries.entryNumber, entryDate: journalEntries.entryDate, description: journalEntries.description, reference: journalEntries.reference, status: journalEntries.status, totalDebit: journalEntries.totalDebit, totalCredit: journalEntries.totalCredit, postedAt: journalEntries.postedAt, createdAt: journalEntries.createdAt });

      if (!entry) throw new Error("Failed to create journal entry");

      const acctRows = await tx.select({ id: chartOfAccounts.id, code: chartOfAccounts.code, name: chartOfAccounts.name }).from(chartOfAccounts).where(eq(chartOfAccounts.organizationId, orgId));
      const accountMap = new Map(acctRows.map((a) => [a.id, a]));

      for (let i = 0; i < validLines.length; i++) {
        const l = validLines[i];
        await tx.insert(journalLines).values({
          journalEntryId: entry.id,
          organizationId: orgId,
          accountId: l.accountId,
          description: l.description || null,
          debit: String(l.debit),
          credit: String(l.credit),
          currency: "AED",
          baseCurrencyDebit: String(l.debit),
          baseCurrencyCredit: String(l.credit),
          lineOrder: i + 1,
        });
      }

      return { je: entry, acctMap: accountMap };
    });

    const lineResults = validLines.map((l, i) => {
      const acct = acctMap.get(l.accountId);
      return {
        id: `line-${i}`,
        accountId: l.accountId,
        accountCode: acct?.code ?? "",
        accountName: acct?.name ?? "",
        description: l.description,
        debit: l.debit,
        credit: l.credit,
        lineOrder: i + 1,
      };
    });

    return NextResponse.json({
      entry: {
        id: je.id,
        entryNumber: je.entryNumber,
        entryDate: je.entryDate,
        description: je.description,
        reference: je.reference ?? undefined,
        status: je.status,
        sourceType: "manual",
        totalDebit: parseFloat(je.totalDebit ?? "0"),
        totalCredit: parseFloat(je.totalCredit ?? "0"),
        postedAt: je.postedAt?.toISOString(),
        createdAt: je.createdAt?.toISOString(),
        lines: lineResults,
      },
    });
  } catch (e: unknown) {
    console.error("[accounting/journal-entries POST] Error:", e);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
