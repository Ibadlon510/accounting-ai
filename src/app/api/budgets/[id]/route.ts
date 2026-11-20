import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  deleteBudget,
  getBudget,
  updateBudget,
  type BudgetLineInput,
} from "@/lib/budgets/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const budget = await getBudget(orgId, id);
    if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    return NextResponse.json({ budget });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load budget";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Ctx) {
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

  let lines: BudgetLineInput[] | undefined;
  if (Array.isArray(body.lines)) {
    lines = body.lines.map((raw) => {
      const line = (raw ?? {}) as Record<string, unknown>;
      return {
        accountId: typeof line.accountId === "string" ? line.accountId : "",
        periodId:
          typeof line.periodId === "string" && line.periodId ? line.periodId : null,
        amount: Number(line.amount),
        notes: typeof line.notes === "string" ? line.notes : null,
        lineOrder: typeof line.lineOrder === "number" ? line.lineOrder : undefined,
      };
    });
  }

  try {
    const budget = await updateBudget(orgId, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      description:
        body.description === null
          ? null
          : typeof body.description === "string"
            ? body.description
            : undefined,
      fiscalYearId:
        body.fiscalYearId === null
          ? null
          : typeof body.fiscalYearId === "string"
            ? body.fiscalYearId
            : undefined,
      periodId:
        body.periodId === null
          ? null
          : typeof body.periodId === "string"
            ? body.periodId
            : undefined,
      startDate:
        typeof body.startDate === "string" ? body.startDate : undefined,
      endDate: typeof body.endDate === "string" ? body.endDate : undefined,
      status:
        body.status === "active" || body.status === "closed" || body.status === "draft"
          ? body.status
          : undefined,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      notes:
        body.notes === null
          ? null
          : typeof body.notes === "string"
            ? body.notes
            : undefined,
      lines,
    });

    return NextResponse.json({ budget });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update budget";
    const status = e instanceof AccountingError ? 400 : 500;
    if (msg === "Budget not found") {
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

  const { id } = await context.params;
  try {
    const result = await deleteBudget(orgId, id);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete budget";
    const status = e instanceof AccountingError ? 400 : 500;
    if (msg === "Budget not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status });
  }
}
