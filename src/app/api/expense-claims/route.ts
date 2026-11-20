import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import {
  listClaimsWithLines,
  submitClaim,
  type ClaimLineInput,
} from "@/lib/expense-claims/service";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const claims = await listClaimsWithLines(orgId);
    return NextResponse.json({ claims });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load expense claims";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "viewer");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const claimDate =
    typeof body.claimDate === "string" && body.claimDate ? body.claimDate : null;
  if (!claimDate) {
    return NextResponse.json({ error: "Claim date is required" }, { status: 400 });
  }

  const claimantName =
    typeof body.claimantName === "string" && body.claimantName.trim()
      ? body.claimantName.trim()
      : null;
  if (!claimantName) {
    return NextResponse.json({ error: "Claimant name is required" }, { status: 400 });
  }

  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (!rawLines.length) {
    return NextResponse.json({ error: "At least one line is required" }, { status: 400 });
  }

  const lines: ClaimLineInput[] = rawLines.map((raw) => {
    const line = (raw ?? {}) as Record<string, unknown>;
    return {
      description: typeof line.description === "string" ? line.description : "",
      category: typeof line.category === "string" ? line.category : "travel",
      expenseDate:
        typeof line.expenseDate === "string" && line.expenseDate
          ? line.expenseDate
          : null,
      expenseAccountId:
        typeof line.expenseAccountId === "string" ? line.expenseAccountId : undefined,
      amount: Number(line.amount),
      taxAmount: line.taxAmount != null ? Number(line.taxAmount) : 0,
    };
  });

  try {
    const claim = await submitClaim({
      organizationId: orgId,
      title,
      description:
        typeof body.description === "string" ? body.description.trim() || null : null,
      claimDate,
      claimantName,
      employeeId:
        typeof body.employeeId === "string" && body.employeeId
          ? body.employeeId
          : null,
      submittedBy: roleCheck.userId,
      currency:
        typeof body.currency === "string" && body.currency
          ? body.currency
          : "AED",
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      lines,
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to submit claim";
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
