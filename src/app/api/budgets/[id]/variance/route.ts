import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { AccountingError } from "@/lib/accounting/engine";
import { getBudgetVariance } from "@/lib/budgets/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const report = await getBudgetVariance(orgId, id);
    return NextResponse.json(report);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load variance report";
    if (msg === "Budget not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
