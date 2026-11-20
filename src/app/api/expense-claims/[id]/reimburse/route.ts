import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import { reimburseClaim } from "@/lib/expense-claims/service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const methodRaw =
    typeof body.method === "string" ? body.method.trim().toLowerCase() : "cash";
  const method = methodRaw === "payable" ? "payable" : "cash";

  try {
    const result = await reimburseClaim({
      organizationId: orgId,
      claimId: id,
      reimbursedBy: roleCheck.userId,
      method,
      creditAccountId:
        typeof body.creditAccountId === "string" ? body.creditAccountId : null,
      reimbursementDate:
        typeof body.reimbursementDate === "string" ? body.reimbursementDate : null,
    });

    return NextResponse.json({
      claim: result.claim,
      journalEntryId: result.journalEntryId,
      entryNumber: result.entryNumber,
      total: result.total,
      note: "Reimbursement journal posted. Entries can only be reversed, not edited or deleted.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to reimburse claim";
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
