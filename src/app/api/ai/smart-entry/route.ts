import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { chartOfAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { parseNaturalLanguageToEntry } from "@/lib/ai/smart-entry";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { nl: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nl = typeof body.nl === "string" ? body.nl.trim() : "";
  if (!nl) {
    return NextResponse.json({ error: "nl is required" }, { status: 400 });
  }

  const parsed = await parseNaturalLanguageToEntry(nl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse entry from that description. Try being more specific (e.g. 'Office supplies 500 AED, paid from bank')." },
      { status: 422 }
    );
  }

  const accounts = await db
    .select({ id: chartOfAccounts.id, code: chartOfAccounts.code, name: chartOfAccounts.name })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.organizationId, orgId),
        eq(chartOfAccounts.isActive, true)
      )
  );

  const byCode = new Map(accounts.map((a) => [a.code, a]));
  const byName = new Map(accounts.map((a) => [a.name.toUpperCase(), a]));

  const lines: Array<{
    accountId: string;
    accountCode: string;
    name: string;
    debit: number;
    credit: number;
    description: string;
  }> = [];

  for (const line of parsed.lines) {
    const account =
      byCode.get(line.accountCode) ??
      byName.get(line.accountName.toUpperCase()) ??
      accounts.find((a) => a.code.startsWith(line.accountCode.slice(0, 2))) ??
      accounts.find((a) => a.name.toUpperCase().includes(line.accountName.toUpperCase()));
    if (!account) continue;
    lines.push({
      accountId: account.id,
      accountCode: account.code,
      name: account.name,
      debit: line.debit,
      credit: line.credit,
      description: line.description,
    });
  }

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "No matching accounts found for this organization. Ensure your chart of accounts is set up." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    suggestedEntry: {
      date: parsed.date,
      description: parsed.description,
      lines,
    },
  });
}
