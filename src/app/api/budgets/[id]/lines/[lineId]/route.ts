import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import { deleteBudgetLine, updateBudgetLine } from "@/lib/budgets/service";

type Ctx = { params: Promise<{ id: string; lineId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id, lineId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const line = await updateBudgetLine(orgId, id, lineId, {
      accountId: typeof body.accountId === "string" ? body.accountId : undefined,
      periodId:
        body.periodId === null
          ? null
          : typeof body.periodId === "string"
            ? body.periodId
            : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      notes:
        body.notes === null
          ? null
          : typeof body.notes === "string"
            ? body.notes
            : undefined,
      lineOrder: typeof body.lineOrder === "number" ? body.lineOrder : undefined,
    });
    return NextResponse.json({ line });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update budget line";
    const status = e instanceof AccountingError ? 400 : 500;
    if (msg === "Budget line not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id, lineId } = await context.params;
  try {
    const result = await deleteBudgetLine(orgId, id, lineId);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete budget line";
    const status = e instanceof AccountingError ? 400 : 500;
    if (msg === "Budget line not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status });
  }
}
