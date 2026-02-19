import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { chartOfAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { learnClassification } from "@/lib/ai/classifier";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { pattern: string; glAccountId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pattern = typeof body.pattern === "string" ? body.pattern.trim() : "";
  const glAccountId = typeof body.glAccountId === "string" ? body.glAccountId.trim() : "";

  if (!pattern || !glAccountId) {
    return NextResponse.json(
      { error: "pattern and glAccountId are required" },
      { status: 400 }
    );
  }

  const [account] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.id, glAccountId),
        eq(chartOfAccounts.organizationId, orgId)
      )
    )
    .limit(1);

  if (!account) {
    return NextResponse.json({ error: "Invalid GL account for this organization" }, { status: 400 });
  }

  await learnClassification(orgId, pattern, glAccountId);

  return NextResponse.json({ ok: true });
}
