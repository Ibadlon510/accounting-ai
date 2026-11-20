import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  createBudget,
  listBudgets,
  type BudgetLineInput,
} from "@/lib/budgets/service";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const budgets = await listBudgets(orgId);
    return NextResponse.json({ budgets });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load budgets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const lines: BudgetLineInput[] = rawLines.map((raw) => {
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

  try {
    const budget = await createBudget({
      organizationId: orgId,
      name,
      description:
        typeof body.description === "string" ? body.description.trim() || null : null,
      fiscalYearId:
        typeof body.fiscalYearId === "string" && body.fiscalYearId
          ? body.fiscalYearId
          : null,
      periodId:
        typeof body.periodId === "string" && body.periodId ? body.periodId : null,
      startDate:
        typeof body.startDate === "string" && body.startDate ? body.startDate : null,
      endDate: typeof body.endDate === "string" && body.endDate ? body.endDate : null,
      status:
        body.status === "active" || body.status === "closed" || body.status === "draft"
          ? body.status
          : "draft",
      currency:
        typeof body.currency === "string" && body.currency ? body.currency : "AED",
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      createdBy: roleCheck.userId,
      lines,
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create budget";
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
