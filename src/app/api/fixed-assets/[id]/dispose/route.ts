import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireWritableOrg } from "@/lib/billing/gates";
import { requireOrgRole } from "@/lib/auth/require-role";
import { AccountingError } from "@/lib/accounting/engine";
import { disposeAsset } from "@/lib/fixed-assets/service";

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const disposalDate =
    typeof body.disposalDate === "string" && body.disposalDate
      ? body.disposalDate
      : null;
  if (!disposalDate) {
    return NextResponse.json({ error: "disposalDate is required" }, { status: 400 });
  }

  const proceeds = Number(body.proceeds ?? 0);
  if (!Number.isFinite(proceeds) || proceeds < 0) {
    return NextResponse.json({ error: "proceeds must be ≥ 0" }, { status: 400 });
  }

  try {
    const result = await disposeAsset({
      organizationId: orgId,
      assetId: id,
      disposalDate,
      proceeds,
      proceedsAccountId:
        typeof body.proceedsAccountId === "string" ? body.proceedsAccountId : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    return NextResponse.json({
      disposal: {
        id: result.disposalId,
        journalEntryId: result.journalEntryId,
        entryNumber: result.entryNumber,
        gainOrLoss: result.gainOrLoss,
      },
      asset: result.asset,
      note: "Disposal journal posted. Entries can only be reversed, not edited or deleted.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to dispose asset";
    const status = e instanceof AccountingError ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
