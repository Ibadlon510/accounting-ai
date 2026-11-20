import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import { addBudgetLine } from "@/lib/budgets/service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const line = await addBudgetLine(orgId, id, {
      accountId: typeof body.accountId === "string" ? body.accountId : "",
      periodId:
        typeof body.periodId === "string" && body.periodId ? body.periodId : null,
      amount: Number(body.amount),
      notes: typeof body.notes === "string" ? body.notes : null,
      lineOrder: typeof body.lineOrder === "number" ? body.lineOrder : undefined,
    });
    return NextResponse.json({ line }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to add budget line";
    const status = e instanceof AccountingError ? 400 : 500;
    if (msg === "Budget not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status });
  }
}
